import { AttachmentBuilder, PermissionFlagsBits } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../../config.json');

export const command = {
    name: "invoice",
    aliases: ["facture", "pdf"],
    run: async (bot, message, args) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Permission insuffisante.");
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const montant = args[1];
        const objet = args.slice(2).join(" ");

        if (!target || !montant || !objet) {
            return message.reply("⚠️ Usage: `+invoice <@membre> <montant> <objet>`");
        }

        const canvas = createCanvas(600, 800);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, 560, 760);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('FACTURE OFFICIELLE', 50, 80);

        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR');
        const heureStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#555555';
        ctx.fillText(`N° FACTURE : #${Math.floor(1000 + Math.random() * 9000)}`, 50, 110);
        ctx.fillText(`DATE : ${dateStr} à ${heureStr}`, 50, 130);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('DESTINATAIRE :', 50, 200);
        ctx.font = '16px sans-serif';
        ctx.fillText(target.user.username, 50, 225);
        ctx.fillText(`ID: ${target.id}`, 50, 245);

        ctx.fillStyle = '#F9F9F9';
        ctx.fillRect(50, 300, 500, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('DESCRIPTION', 60, 325);
        ctx.fillText('TOTAL', 480, 325);

        ctx.font = '16px sans-serif';
        ctx.fillText(objet.substring(0, 40), 60, 380);
        ctx.fillText(`${montant} €`, 480, 380);

        ctx.beginPath();
        ctx.moveTo(50, 400);
        ctx.lineTo(550, 400);
        ctx.stroke();

        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('TOTAL RÉGLÉ :', 300, 450);
        ctx.fillText(`${montant} €`, 480, 450);

        ctx.font = 'italic 12px sans-serif';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText('Paiement reçu et validé. Ce document sert de preuve d\'achat.', 50, 720);
        ctx.fillText(`Généré par ${bot.user.username} - Boutique officielle ${message.guild.name}`, 50, 740);

        if (config.shop.logo_paypal) {
            try {
                const logo = await loadImage(config.shop.logo_paypal);
                ctx.drawImage(logo, 450, 50, 100, 60);
            } catch (e) {}
        }

        ctx.save();
        ctx.font = 'bold 70px sans-serif';
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)'; 
        ctx.textAlign = 'center';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); 

        for (let i = -4; i <= 4; i++) {
            ctx.fillText(message.guild.name.toUpperCase(), 0, i * 110);
        }
        ctx.restore();

        const buffer = canvas.toBuffer();
        const attachment = new AttachmentBuilder(buffer, { name: `facture-${target.user.username}.png` });

        await message.channel.send({ 
            content: `✅ Facture générée avec succès pour **${target.user.username}** !`, 
            files: [attachment] 
        });

        target.send({ 
            content: `📦 **Merci pour votre achat !** Voici votre facture officielle :`, 
            files: [attachment] 
        }).catch(() => {});
    }
};