pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        // Si tu NestJS se conecta a la BD usando variables de entorno, las puedes definir aquí:
        // DATABASE_HOST = 'localhost'
        // DATABASE_PORT = '5432'
    }

    stages {
        stage('Clonar Repositorio') {
            steps {
                git url: 'https://github.com', branch: 'main'
            }
        }

        stage('Levantar Base de Datos') {
            steps {
                echo 'Iniciando contenedores de Docker Compose...'
                // Levanta la base de datos en segundo plano (-d)
                sh 'docker-compose up -d'
                
                echo 'Esperando a que la base de datos esté lista...'
                // Pausa opcional de 10 segundos para darle tiempo a la BD de iniciar completamente
                sleep time: 10, unit: 'SECONDS'
            }
        }

        stage('Instalar Dependencias') {
            steps {
                sh 'npm install'
            }
        }

        stage('Compilar Proyecto') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Arrancar Servidor') {
            steps {
                echo 'Iniciando el servidor de NestJS en segundo plano...'
                // Usando PM2 para gestionar el proceso de Node de forma independiente
                sh 'pm2 restart "nestjs-server" || pm2 start dist/main.js --name "nestjs-server"'
            }
        }
    }
    
    post {
        failure {
            echo 'El pipeline falló. Revisando si es necesario limpiar contenedores...'
            // Opcional: si algo falla, puedes decidir si apagas los contenedores o los dejas corriendo
            // sh 'docker-compose down'
        }
    }
}
