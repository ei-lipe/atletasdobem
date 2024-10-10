// connection.js
const { Client } = require('pg');

// Configuração da conexão
const client = new Client({
  host: 'atletasdobem.c18smuuqub9j.us-east-1.rds.amazonaws.com',
  user: 'postgres',
  password: 'atletasdobem013',
  database: 'postgres',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Tratamento de erro em conexão ao DB
client.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados: ', err.stack);
  } else {
    console.log('Conexão estabelecida com sucesso!');
  }
});

module.exports = client; // Exporta o cliente para ser usado em outros arquivos