const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve all files in the current directory

// Endpoint to handle contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { tutorName, petName, phone, scheduleDay, scheduleTime } = req.body;

        // Validation
        if (!tutorName || !petName || !phone || !scheduleDay || !scheduleTime) {
            return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
        }

        // Construct the WhatsApp message
        const message = `🐶 *Novo Contato pelo Site!* 🐶\n\n*Tutor:* ${tutorName}\n*Pet:* ${petName}\n*Telefone do Tutor:* ${phone}\n\n*Agendamento Desejado:*\n📅 ${scheduleDay}\n⏰ Turno da ${scheduleTime}\n\n_Mensagem enviada automaticamente através do formulário do site._`;

        // Evolution API endpoint for sending text messages
        const apiUrl = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.INSTANCE_NAME}`;

        // Target number needs to be internationally formatted without + (e.g., 5551989353003)
        // If the TARGET_WHATSAPP_NUMBER setting exists, redirect everything there (to the business owner)
        const targetNumber = process.env.TARGET_WHATSAPP_NUMBER;

        if (!targetNumber) {
            console.error('TARGET_WHATSAPP_NUMBER is not set in .env');
            return res.status(500).json({ error: 'Erro de configuração no servidor.' });
        }

        // Send request to Evolution API
        const response = await axios.post(apiUrl, {
            number: targetNumber,
            text: message
        }, {
            headers: {
                'apikey': process.env.EVOLUTION_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Mensagem enviada com sucesso para Evolution API:', response.data);
        res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });

    } catch (error) {
        // Detailed error logging specifically for Evolution API trace details
        console.error('Erro ao comunicar com Evolution API:', error?.response?.data || error.message);

        // Return a generic error to the frontend and do not expose API keys or details
        res.status(500).json({ error: 'Falha ao processar o agendamento. Tente novamente mais tarde.' });
    }
});

// Endpoint to manage Evolution API Instance and fetch QR Code
app.get('/api/qrcode', async (req, res) => {
    const instanceName = process.env.INSTANCE_NAME;
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_API_KEY;

    try {
        let instanceExists = false;

        // 1. Check if instance exists and connection state
        const stateUrl = `${apiUrl}/instance/connectionState/${instanceName}`;

        try {
            const stateResponse = await axios.get(stateUrl, {
                headers: { 'apikey': apikey }
            });
            instanceExists = true;

            // If already connected, return success without QR Code
            if (stateResponse.data && stateResponse.data.instance && stateResponse.data.instance.state === 'open') {
                return res.json({ status: 'open', instanceName });
            }
        } catch (stateErr) {
            // Instance probably doesn't exist, which returns a 404 from Evolution API
            console.log('Instance not found, proceeding to create.', stateErr.message);
        }

        // Return early if we only want to check the status (auto-reload on page load)
        if (req.query.checkOnly === 'true') {
            return res.json({ status: 'disconnected', instanceName });
        }

        let qrBase64 = null;

        if (!instanceExists) {
            // 2a. Instance doesn't exist: Create it and fetch QR Code
            const createUrl = `${apiUrl}/instance/create`;
            const createPayload = {
                instanceName: instanceName,
                qrcode: true, // Request the QR Code base64 image
                integration: "WHATSAPP-BAILEYS"
            };

            const createResponse = await axios.post(createUrl, createPayload, {
                headers: {
                    'apikey': apikey,
                    'Content-Type': 'application/json'
                }
            });

            // Evolution API returns the QR base64 code under `qrcode.base64` or `hash.qrcode`
            qrBase64 = createResponse.data?.qrcode?.base64 || createResponse.data?.hash?.qrcode;
        }

        // 2b. Instance exists but not open, or created but no QR returned: Try to connect to get QR
        if (!qrBase64) {
            const connectUrl = `${apiUrl}/instance/connect/${instanceName}`;
            const connectResponse = await axios.get(connectUrl, { headers: { 'apikey': apikey } });
            qrBase64 = connectResponse.data?.base64;
        }

        if (qrBase64) {
            res.json({ qrcode: qrBase64, instanceName, status: 'connecting' });
        } else {
            throw new Error('QR Code não gerado pela API.');
        }

    } catch (error) {
        console.error('Erro na geração do QR Code:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Falha ao buscar QR Code. Verifique se a Evolution API está rodando.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse o painel de conexão do WhatsApp em: http://localhost:${PORT}/qrcode.html`);
});
