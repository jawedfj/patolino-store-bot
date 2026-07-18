const { processOrder, approveOrder } = require("../../Functions/carrinho");
const { ActivityType } = require("discord.js");
const { General } = require("../../Database");

module.exports = {
    name: "ready",
    run: async (client) => {

        let processingOrders = false;
        let approvingOrders = false;

        setInterval(async () => {
            if (processingOrders) return;
            processingOrders = true;
            try { await processOrder(client); } catch (e) { console.error('processOrder error:', e); }
            processingOrders = false;
        }, 20000);

        setInterval(async () => {
            if (approvingOrders) return;
            approvingOrders = true;
            try { await approveOrder(client); } catch (e) { console.error('approveOrder error:', e); }
            approvingOrders = false;
        }, 15000);

        let i = 0;
        let toggle = true;

        setInterval(() => {
            let data = General.get("System.App.status");

            if (!data || !Array.isArray(data)) data = [];
            if (data.length === 0) return console.log("Nenhum status encontrado.");

            const activities = data.map(item => ({
                name: item,
                url: item.url || null
            }));
            if (i >= activities.length) i = 0;

            const activity = { ...activities[i] };
            activity.type = ActivityType.Custom;

            client.user.setActivity(activity);

            i++;
        }, 30000);

    }
}
