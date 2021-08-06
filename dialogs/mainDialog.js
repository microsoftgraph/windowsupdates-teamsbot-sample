// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// const {jwt_decode} = require('jwt-decode');
const {jwt_decode} = require('jwt-decode');
const {MessageFactory, CardFactory} = require('botbuilder');
const { ConfirmPrompt, DialogSet, DialogTurnStatus, OAuthPrompt, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { LogoutDialog } = require('./logoutDialog');
const  {WorkflowSelectionDialog } = require('./workflowSelectionDialog');
const { WORKFLOW_SELECTION_DIALOG } = require('./dialogConstants');

const CONFIRM_PROMPT = 'ConfirmPrompt';
const MAIN_DIALOG = 'MainDialog';
const MAIN_WATERFALL_DIALOG = 'MainWaterfallDialog';
const OAUTH_PROMPT = 'OAuthPrompt';
const TEXT_PROMPT = 'TextPrompt';


class MainDialog extends LogoutDialog {
    constructor() {
        super(MAIN_DIALOG, process.env.connectionName);

        // OAuth Prompt
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
            connectionName: process.env.connectionName,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

        // Confirm Prompt
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        // Text Prompt
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        // Workflow Selection Dialog
        this.addDialog(new WorkflowSelectionDialog());

        // Main Waterfall Dialog
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.oAuthPromptStep.bind(this),
            this.loginStep.bind(this)
        ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} dialogContext
     */
    async run(context, dialogStateAccessor) {
        const dialogSet = new DialogSet(dialogStateAccessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async oAuthPromptStep(stepContext) {
        const card = CardFactory.heroCard(
            'Welcome to the WUfB DS Teams Chat Bot!',
            'If this is your first time using this bot, you will need to sign in.',
            null,
            null
        );
        await stepContext.context.sendActivity(MessageFactory.attachment(card));

        return await stepContext.beginDialog(OAUTH_PROMPT);
    }

    async loginStep(stepContext) {
        // Get the token from the previous step. Note that we could also have gotten the token directly from the prompt itself.
        const tokenResponse = stepContext.result;
 
        if (tokenResponse) {
            
            // // check for role
            // const decodedToken = jwt_decode(tokenResponse);
            // console.log(JSON.stringify(decodedToken));
            
            return await stepContext.beginDialog(WORKFLOW_SELECTION_DIALOG);

  
        } 
        await stepContext.context.sendActivity('Login was not successful please try again.');
        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;
