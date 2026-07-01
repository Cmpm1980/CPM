require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const abastecimentoRoutes = require('./routes/abastecimento');
const apiSyncRoutes = require('./routes/api-sync');
const viaturasRoutes = require('./routes/viaturas');
const depositoRoutes = require('./routes/deposito');
const dashboardRoutes = require('./routes/dashboard');
const utilizadoresRoutes = require('./routes/utilizadores');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'muda-me-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 12 } // 12 horas
}));

app.get('/', (req, res) => res.redirect(req.session.utilizador ? '/abastecer' : '/login'));

app.use(authRoutes);
app.use(abastecimentoRoutes);
app.use(apiSyncRoutes);
app.use(viaturasRoutes);
app.use(depositoRoutes);
app.use(dashboardRoutes);
app.use(utilizadoresRoutes);

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`Gestao de Frota a correr na porta ${PORTA}`);
});
