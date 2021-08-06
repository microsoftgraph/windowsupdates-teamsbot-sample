const { ConfirmPrompt, DialogSet, DialogTurnStatus, OAuthPrompt, WaterfallDialog, TextPrompt, ComponentDialog, DateTimePrompt } = require('botbuilder-dialogs');
const { CONFIRM_PROMPT, CREATE_XS_DEPLOYMENT_DIALOG, OAUTH_PROMPT, TEXT_PROMPT, EXP_SECURITY_UPDATE } = require('./dialogConstants');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const { GraphHelpers } = require('./graph-helpers');



class CreateXSDeploymentDialog extends ComponentDialog {

    constructor() {
        super(CREATE_XS_DEPLOYMENT_DIALOG);
        
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.retrieveTokenStep.bind(this),
            this.confirmDeploymentDetailsStep.bind(this), 
            this.passDeploymentObject.bind(this)
        ]));

        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
            connectionName: process.env.connectionName,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async retrieveTokenStep(stepContext) {
        return await stepContext.beginDialog(OAUTH_PROMPT);   
    }

    async confirmDeploymentDetailsStep(stepContext) {
        const tokenResponse = stepContext.result;

        if (tokenResponse) {
            const catalog = await GraphHelpers.getAvailableUpdates(stepContext, tokenResponse, EXP_SECURITY_UPDATE);
            if (catalog.length == 0) {
                await stepContext.context.sendActivity('There are no available security updates at this time.');
                return await stepContext.endDialog();
            }

            const mostRecentEntry = catalog[0];
            const id = mostRecentEntry.id;
            const displayName = mostRecentEntry.displayName;
            const releaseDate = mostRecentEntry.releaseDateTime;

            const deployment = {
                '@odata.type': '#microsoft.graph.windowsUpdates.deployment',
                content: {
                    '@odata.type': '#microsoft.graph.windowsUpdates.expeditedQualityUpdateReference',
                    classification: 'security',
                    equivalentContent:'latestSecurity',
                    releaseDateTime: releaseDate
                }   
            };
            stepContext.values.newDeployment = deployment;

            return await stepContext.prompt(CONFIRM_PROMPT,  
                'You are automatically being offered the most recent security update.<br><br><b>' + displayName + 
                '</b> (id: ' + id.substr(0,7) + '...)<br> Published on: ' + releaseDate.substr(0,10) + 
                '<br><br> Any devices targeted by this deployment with an older security update will now receive this update. <br><br> Would you like to proceed in creating this deployment?');
  
        }

        return await stepContext.endDialog();
        
    }


    async passDeploymentObject(stepContext) {
        if (stepContext.result) {
            return await stepContext.endDialog(stepContext.values.newDeployment);
        }
        await stepContext.context.sendActivity('Cancelled deployment creation.')
        return await stepContext.endDialog();
    }

   
}

module.exports.CreateXSDeploymentDialog = CreateXSDeploymentDialog;
