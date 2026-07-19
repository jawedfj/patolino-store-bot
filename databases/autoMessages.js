const Sequelize = require('sequelize')
const dbAutoFunctions = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'dbAutoFunctions.sqlite',
});


const dbMessageAuto = dbAutoFunctions.define('autoMessages', {
    messageID: {
        type: Sequelize.STRING,
        unique: true
    },
    messageStyle: Sequelize.STRING,
    messageSend: Sequelize.TEXT,
    sendType: Sequelize.INTEGER,
    sendHour: Sequelize.STRING,
    sendDelay: Sequelize.INTEGER,
    channelID: Sequelize.STRING,
    On_Off: Sequelize.STRING,
    embedTitle: Sequelize.STRING,
    embedDescription: Sequelize.TEXT,
    embedColor: Sequelize.STRING,
    embedThumbnail: Sequelize.STRING,
    embedImage: Sequelize.STRING
})

const initDatabase = async () => {
    try {
        await dbAutoFunctions.authenticate();
        await dbMessageAuto.sync()
    } catch (error) {
        console.error(`Algo deu errado ao conectar ao banco de dados: ${error}`);
    }
};

module.exports = {
    dbMessageAuto,
    initDatabase
};
