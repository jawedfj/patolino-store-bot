const colors = require('colors');

class Console {
    /**
     * Gera timestamp no formato [dd/mm/yyyy hh:mm:ss]
     * @returns {string}
     */
    static timestamp() {
        const now = new Date();
        const date = now.toLocaleDateString('pt-BR');
        const time = now.toLocaleTimeString('pt-BR');
        return `[${date} ${time}]`;
    }

    /**
     * @param {number} type - Tipo da mensagem ( 1=info, 2=success, 3=warning, 4=debug, 5=error )
     * @param {string} message - Mensagem principal
     * @param {Error} [error] - Objeto de erro (opcional)
     */
    static logging(type, message, error) {
        switch (type) {
            case 1:
                this.info(message);
                break;
            case 2:
                this.success(message);
                break;
            case 3:
                this.warning(message);
                break;
            case 4:
                this.debug(message);
                break;
            case 5:
                this.error(message, error);
                break;
            default:
                this.info(message);
        }
    }

    static info(message) {
        console.log(colors.brightCyan(`${this.timestamp()} [INFO] ${message}`));
    }

    static error(message, error) {
        if (error && error.stack) {
            const location = error.stack.split('\n')[1]?.trim() || 'local desconhecido';
            console.log(colors.red(`${this.timestamp()} [ERROR] ${message}\n⤷ Em: ${location}`));
        } else {
            console.log(colors.red(`${this.timestamp()} [ERROR] ${message}`));
        }
    }

    static success(message) {
        console.log(colors.green(`${this.timestamp()} [SUCCESS] ${message}`));
    }

    static warning(message) {
        console.log(colors.yellow(`${this.timestamp()} [WARNING] ${message}`));
    }

    static debug(message) {
        console.log(colors.magenta(`${this.timestamp()} [DEBUG] ${message}`));
    }
}


module.exports = { 
    Console
}