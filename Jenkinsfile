// CI/CD pipeline: install + lint/test + build -> Docker image -> push to registry -> deploy to ROSA (dev)
// -> smoke test -> manual approval -> deploy to ROSA (prod).
//
// Mirrors the pipeline in payment-gateway-microservices and reuses its Jenkins setup.
// Jenkins prerequisites:
//   Agent with Node.js 22, Docker CLI + daemon, oc CLI and kustomize.
//   Credentials (same IDs as the backend pipeline):
//     registry-credentials  (Username/Password)  e.g. Quay.io robot account or ECR
//     rosa-dev-token        (Secret text)        token of the jenkins-deployer service account in payments-dev
//     rosa-prod-token       (Secret text)        token of the jenkins-deployer service account in payments-prod
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 30, unit: 'MINUTES')
    }

    parameters {
        string(name: 'REGISTRY', defaultValue: 'quay.io/andrewsselvaraj', description: 'Image registry/namespace')
        string(name: 'ROSA_API_URL', defaultValue: 'https://api.<cluster>.<id>.p1.openshiftapps.com:6443', description: 'ROSA cluster API URL')
        booleanParam(name: 'DEPLOY_PROD', defaultValue: false, description: 'Promote to payments-prod after dev smoke test')
    }

    environment {
        APP = 'payment-gateway-fe'
        IMAGE_TAG = "${env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : 'local'}-${env.BUILD_NUMBER}"
        IMAGE = "${params.REGISTRY}/payment-gateway-fe"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci --no-audit --no-fund'
            }
        }

        stage('Unit Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${env.IMAGE}:${env.IMAGE_TAG} ."
            }
        }

        stage('Image Scan') {
            steps {
                // Fails the build on CRITICAL vulnerabilities when Trivy is installed on the agent.
                sh """
                  if command -v trivy >/dev/null 2>&1; then
                    trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed ${env.IMAGE}:${env.IMAGE_TAG}
                  else
                    echo 'trivy not installed, skipping image scan'
                  fi
                """
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'registry-credentials',
                        usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    script {
                        def registryHost = params.REGISTRY.tokenize('/')[0]
                        sh 'echo "$REG_PASS" | docker login -u "$REG_USER" --password-stdin ' + registryHost
                        sh "docker push ${env.IMAGE}:${env.IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Deploy to ROSA (dev)') {
            steps {
                deployTo('payments-dev', 'dev', 'rosa-dev-token')
            }
        }

        stage('Smoke Test (dev)') {
            steps {
                withCredentials([string(credentialsId: 'rosa-dev-token', variable: 'OC_TOKEN')]) {
                    sh '''
                      oc login --token="$OC_TOKEN" --server="$ROSA_API_URL" >/dev/null
                      HOST=$(oc get route payment-gateway-fe -n payments-dev -o jsonpath='{.spec.host}')
                      ./scripts/smoke-test.sh "https://$HOST"
                    '''
                }
            }
        }

        stage('Approve Prod') {
            when { expression { params.DEPLOY_PROD } }
            steps {
                timeout(time: 30, unit: 'MINUTES') {
                    input message: "Deploy ${env.APP} ${env.IMAGE_TAG} to payments-prod?", ok: 'Deploy'
                }
            }
        }

        stage('Deploy to ROSA (prod)') {
            when { expression { params.DEPLOY_PROD } }
            steps {
                deployTo('payments-prod', 'prod', 'rosa-prod-token')
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        failure {
            echo "Pipeline failed for ${env.APP} ${env.IMAGE_TAG}"
        }
    }
}

// Pins the new image tag in the overlay, applies it, and waits for the rollout.
// A failed rollout is rolled back automatically.
def deployTo(String namespace, String overlay, String tokenId) {
    withCredentials([string(credentialsId: tokenId, variable: 'OC_TOKEN')]) {
        sh """
          oc login --token="\$OC_TOKEN" --server="${params.ROSA_API_URL}" >/dev/null
          cd k8s/overlays/${overlay}
          kustomize edit set image ${env.APP}=${env.IMAGE}:${env.IMAGE_TAG}
          cd -
          oc apply -k k8s/overlays/${overlay}
          if ! oc rollout status deployment/${env.APP} -n ${namespace} --timeout=300s; then
            oc rollout undo deployment/${env.APP} -n ${namespace}
            exit 1
          fi
        """
    }
}
