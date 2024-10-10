const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

// Configurações do banco de dados PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'atletasdobem.c18smuuqub9j.us-east-1.rds.amazonaws.com',
  database: 'postgres',
  password: 'atletasdobem013',
  port: 5432, // Porta padrão do PostgreSQL
  ssl: {
    rejectUnauthorized: false, // Essa opção pode ser necessária dependendo das suas configurações
  }
});

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

app.use(session({
  store: new PgSession({
    pool: pool, // Usa o mesmo pool de conexão ao PostgreSQL
    tableName: 'session' // Tabela onde as sessões serão armazenadas
  }),
  secret: 'sua-chave-secreta-aqui', // Troque por uma chave mais segura
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 // Sessão válida por 30 dias
  }
}));

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const query = `
      SELECT * FROM usuarios 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(senha, user.senha);
      
      if (isPasswordValid) {
        // Armazena informações do usuário na sessão
        req.session.userId = user.id; // Armazena o ID do usuário
        req.session.isLoggedIn = true;
        
        res.json({ message: 'Login realizado com sucesso', user: user });
      } else {
        res.status(401).json({ message: 'Email ou senha incorretos' });
      }
    } else {
      res.status(401).json({ message: 'Email ou senha incorretos' });
    }
  } catch (error) {
    console.error('Erro ao realizar o login:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Endpoint para cadastrar Pessoa Física
const bcrypt = require('bcrypt'); // Certifique-se de importar bcrypt

app.post('/cadastro/pessoa-fisica', async (req, res) => {
  const { cpf, nome, email, senha } = req.body;

  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10); // 10 é o número de salt rounds

    const query = `
      INSERT INTO usuarios (cpf, nome_completo, email, senha, tipo_usuario)
      VALUES ($1, $2, $3, $4, 'fisica')
    `;
    
    // Inserindo no banco de dados com a senha hashada
    await pool.query(query, [cpf, nome, email, hashedPassword]);
    res.status(200).json({ message: 'Cadastro de Pessoa Física realizado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao realizar o cadastro de Pessoa Física' });
  }
});



// Endpoint para cadastrar Pessoa Jurídica
app.post('/cadastro/pessoa-juridica', async (req, res) => {
  const { cnpj, razaoSocial, email, senha } = req.body;

  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10); // 10 é o número de salt rounds

    const query = `
      INSERT INTO usuarios (cnpj, razao_social, email, senha, tipo_usuario)
      VALUES ($1, $2, $3, $4, 'juridica')
    `;
    
    // Inserindo no banco de dados com a senha hashada
    await pool.query(query, [cnpj, razaoSocial, email, hashedPassword]);
    res.status(200).json({ message: 'Cadastro de Pessoa Jurídica realizado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao realizar o cadastro de Pessoa Jurídica' });
  }
});

// Configuração do Multer para armazenamento de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Pasta onde as imagens serão armazenadas
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo
  }
});

const upload = multer({ storage: storage });

// Middleware para servir arquivos estáticos (imagens)
app.use('/uploads', express.static('uploads'));

// Endpoint para cadastrar um produto
app.post('/produtos', upload.single('imagem'), async (req, res) => {
  const { nome_artigo, quantidade, descricao, tamanho, condicao, categoria } = req.body;
  const imagem = req.file.filename;

  try {
    const query = `
      INSERT INTO produtos (nome_artigo, imagem, descricao, quantidade, tamanho, condicao, categoria)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    const result = await pool.query(query, [nome_artigo, imagem, descricao, quantidade, tamanho, condicao, categoria]);
    res.status(201).json({ message: 'Produto cadastrado com sucesso!', produto: result.rows[0] });
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
});


// Endpoint para obter todos os produtos
app.get('/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter produtos:', error);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
});




// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
