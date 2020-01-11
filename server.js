const {
    ApolloServer
} = require('apollo-server-express');
require('dotenv').config()
const express = require('express');
const cors = require('cors')
const resolvers = require('./data/resolvers');
const typeDefs = require('./data/typeDefs');
const models = require('./models');
models.sequelize
    .sync()
    .then(() => {
        console.log('connected :D');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });


const app = express();

// app.use(cors())

const server = new ApolloServer({
    typeDefs,
    resolvers,

})

server.applyMiddleware({
    app,
    path: '/api',

})


app.listen(process.env.PORT, () => console.log(`app runing `))
