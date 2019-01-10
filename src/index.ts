// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
/* tslint:disable */
import * as path from "path";
import * as restify from "restify";
import { BotFrameworkAdapter, ConversationState, MemoryStorage } from "botbuilder";
import { BotConfiguration, IEndpointService } from "botframework-config";
import { config } from "dotenv";
import { MyBot } from "./bot";
import { POLICY, TERMS } from "./legal";

const ENV_FILE = path.join(__dirname, "..", ".env");
const env = config({ path: ENV_FILE });
const DEV_ENVIRONMENT = "development";
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);
const server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
});

// .bot file path
const BOT_FILE = path.join(__dirname, "..", (process.env.botFilePath || ""));

let botConfig;
try {
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.\n\n`);
    process.exit();
}

// Get bot endpoint configuration by service name
const endpointConfig = <IEndpointService>botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration .
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

const memoryStorage = new MemoryStorage();

const conversationState = new ConversationState(memoryStorage);

const myBot = new MyBot(conversationState);

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError]: ${error}`);
    context.sendActivity(`Oops. Something went wrong!`);
    await conversationState.load(context);
    await conversationState.clear(context);
    await conversationState.saveChanges(context);
};

/* tslint:enable */
// Listen for incoming requests.
server.post("/api/messages", (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.onTurn(context);
    });
});

server.get("/terms-of-use", (req, res) => {
    res.header("Content-Type", "text/html");
    res.write(TERMS);
    res.end();
});

server.get("/privacy-policy", (req, res) => {
    res.header("Content-Type", "text/html");
    res.write(POLICY);
    res.end();
});
