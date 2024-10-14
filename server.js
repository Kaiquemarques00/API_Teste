import express from "express";
import env from "dotenv";
import pg from "pg";
import bcrypt from 'bcrypt';

// aplicativo express
const app = express();

// uso do middleware para dados json, para parsear json
app.use(express.json());
env.config();

// inserindo informações para conexão no banco
const db = new pg.Client({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    ssl: {
      rejectUnauthorized: false
    }
  });

// conectando no banco
db.connect();

// iniciando uma rota GET no endpoint /user que faz algo, no caso traz todos os usuarios
app.get("/user", async (req, res) => {
    // bloco try para tentar contato com o banco de dados
    try {
        // faz e armazena uma query select para todos os dados da tabela usuario
        const require = await db.query("SELECT * FROM usuario");
        // a requisição traz diversas informações, a propriedade rows traz so os dados da tabela.
        const admin = require.rows;
        // após as operações é retornado uma resposta de status http 200 e o json com os dados retornados.
        res.status(200).json(admin);
      } 
      // em caso de erro na requisição do banco
      catch (error) {
        // imprimi erro no console sem interromper aplicação
        console.log(error);
      }
});

// iniciando rota POST para o mesmo endpoint /user, que adiciona um usuario no banco de dados
app.post("/user", async (req, res) => {
    // bloco try para tentar contato com o banco de dados
    try {
        // busca e armaneza um usuario com o email requisitado
        const require = await db.query("SELECT * FROM usuario WHERE email = ($1)", [req.body.email]);
        // pega o dados da requisição
        const users = require.rows;

        // se a variavel de requisição (que retorna um array com objeto) tiver tamanho maior que zero ou seja, existir um user ele retorna mesagem de usuario existente
        if (users.length > 0) return res.status(409).json("User already exists");

        // faz um parametro de rodadas de salt para hash da senha
        const salt = bcrypt.genSaltSync(10);
        // pega a senha inserida na requisição e aplica o hash nela
        const hashedPassword = bcrypt.hashSync(req.body.senha, salt);

        // pega todas as informações inseridas.
        const nome = req.body.nome;
        const email = req.body.email;
        const cargo = req.body.cargo;

        // inicia um objeto de data
        const data = new Date();
        // formada uma data compativel com banco de dados
        const dataFormatada = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;
        
        // faz uma query de inserção com as informações inseridas e armazena essa informações
        const user = await db.query("INSERT INTO usuario (nome, email, senha, cargo, criado_em)  VALUES ($1, $2, $3, $4, $5) RETURNING *", [nome, email, hashedPassword, cargo, dataFormatada]);
        // resposta retorna um status de criação 201 e os dados que foram armazenados.
        res.status(201).json(user.rows[0]);
      } 
      // em caso de erro na requisição do banco
      catch (error) {
        // imprimi erro no console sem interromper aplicação
        console.log(error);
      }
});

// inicia o servidor na porta 3000 e 
app.listen(process.env.PORTAPI ? Number(process.env.PORTAPI) : 3000, () => {
  console.log("HTTP Server Running");
});