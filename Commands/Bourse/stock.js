import axios from 'axios';

export const command = {
    name: "stock",
    aliases: ["prix"],
    description: "Affiche le prix d'une action avec conversion Euros",
    run: async (bot, message, args) => {
        const symbol = args[0]?.toUpperCase();
        if (!symbol) return message.reply("⚠️ Usage: `+stock [SYMBOLE]` (ex: NVDA)");

        message.channel.sendTyping();

        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
            const response = await axios.get(url);
            const meta = response.data.chart.result[0].meta;
            
            const currentPrice = meta.regularMarketPrice;
            const currency = meta.currency;
            const change = currentPrice - meta.previousClose;
            const percent = (change / meta.previousClose) * 100;

            let priceDisplay = `**${currentPrice.toFixed(2)} ${currency}**`;
            if (currency === "USD") {
                const priceEUR = currentPrice * 0.92; 
                priceDisplay += ` (*~${priceEUR.toFixed(2)}€*)`;
            }

            const embed = {
                title: `Bourse : ${symbol}`,
                color: change >= 0 ? 0x2ECC71 : 0xE74C3C,
                fields: [
                    { name: "Prix Actuel", value: priceDisplay, inline: true },
                    { name: "Variation", value: `**${change >= 0 ? '+' : ''}${change.toFixed(2)}** (${percent.toFixed(2)}%)`, inline: true },
                    { name: "Marché", value: meta.exchangeName, inline: true }
                ],
                footer: { text: "Source: Yahoo Finance" },
                timestamp: new Date()
            };

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply("❌ Symbole introuvable.");
        }
    }
};