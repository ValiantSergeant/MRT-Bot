import axios from 'axios';
import db from '../../Events/loadDatabase.js';

export const command = {
    name: "wallet",
    aliases: ["w"],
    description: "Gère ton portefeuille boursier",
    run: async (bot, message, args) => {
        const userId = message.author.id;
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'add') {
            const symbol = args[1]?.toUpperCase();
            const qty = parseFloat(args[2]);

            if (!symbol || isNaN(qty) || qty <= 0) return message.reply("⚠️ Usage: `+wallet add [SYMBOLE] [QTÉ]`");

            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
                const response = await axios.get(url);
                const currentPrice = response.data.chart.result[0].meta.regularMarketPrice;

                db.get('SELECT * FROM wallet WHERE discord_id = ? AND symbol = ?', [userId, symbol], (err, row) => {
                    if (row) {
                        const newQty = row.quantity + qty;
                        const newPrice = ((row.buy_price * row.quantity) + (currentPrice * qty)) / newQty;
                        db.run('UPDATE wallet SET quantity = ?, buy_price = ? WHERE discord_id = ? AND symbol = ?', [newQty, newPrice, userId, symbol]);
                    } else {
                        db.run('INSERT INTO wallet (discord_id, symbol, quantity, buy_price) VALUES (?, ?, ?, ?)', [userId, symbol, qty, currentPrice]);
                    }
                    message.reply(`✅ Ajouté **${qty}** ${symbol} à ton wallet.`);
                });
            } catch (e) { message.reply("❌ Symbole invalide."); }

        } else if (subCommand === 'remove') {
            const symbol = args[1]?.toUpperCase();
            const qty = parseFloat(args[2]);

            db.get('SELECT * FROM wallet WHERE discord_id = ? AND symbol = ?', [userId, symbol], (err, row) => {
                if (!row || row.quantity < qty) return message.reply("❌ Tu n'as pas assez d'actions.");
                if (row.quantity === qty) db.run('DELETE FROM wallet WHERE discord_id = ? AND symbol = ?', [userId, symbol]);
                else db.run('UPDATE wallet SET quantity = ? WHERE discord_id = ? AND symbol = ?', [row.quantity - qty, userId, symbol]);
                message.reply(`✅ Retiré **${qty}** ${symbol}.`);
            });

        } else {
            db.all('SELECT * FROM wallet WHERE discord_id = ?', [userId], async (err, rows) => {
                if (!rows || rows.length === 0) return message.reply("Ton wallet est vide.");

                let totalValueEUR = 0;
                let description = "";

                for (const row of rows) {
                    try {
                        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${row.symbol}`;
                        const res = await axios.get(url);
                        const price = res.data.chart.result[0].meta.regularMarketPrice;
                        const currency = res.data.chart.result[0].meta.currency;
                        
                        let priceEUR = currency === "USD" ? price * 0.92 : price;
                        const valueEUR = priceEUR * row.quantity;
                        totalValueEUR += valueEUR;

                        description += `**${row.symbol}**: ${row.quantity} act. | **${valueEUR.toFixed(2)}€**\n`;
                    } catch (e) { description += `⚠️ **${row.symbol}**: Erreur\n`; }
                }

                const embed = {
                    title: `Wallet de ${message.author.username}`,
                    description: description,
                    color: 0x3498DB,
                    fields: [{ name: "Valeur Totale Estimée", value: `**${totalValueEUR.toFixed(2)}€**` }],
                    footer: { text: "Taux de change indicatif: 1$ = 0.92€" }
                };
                message.reply({ embeds: [embed] });
            });
        }
    }
};