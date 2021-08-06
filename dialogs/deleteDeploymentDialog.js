const { WaterfallDialog, ComponentDialog, TextPrompt, OAuthPrompt } = require('botbuilder-dialogs');
const { TEXT_PROMPT, OAUTH_PROMPT, DELETE_DEPLOYMENT_DIALOG, CONFIRM_PROMPT } = require("./dialogConstants");
const { GraphHelpers } = require('./graph-helpers');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class DeleteDeploymentDialog extends ComponentDialog {
    constructor() {
        super(DELETE_DEPLOYMENT_DIALOG);

        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
            connectionName: process.env.connectionName,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.promptDeploymentId.bind(this),
            this.confirmDelete.bind(this),
            this.retrieveTokenStep.bind(this),
            this.deleteDeploymentStep.bind(this), 
            this.sendConfirmationStep.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }


    async promptDeploymentId(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT, "Tell me the ID of the deployment you want to delete. <br><br> <b> WARNING </b>: this action cannot be undone. ");
    }

    async confirmDelete(stepContext) {
        stepContext.values.deleteDeploymentId = stepContext.result.trim();
        return await stepContext.prompt(CONFIRM_PROMPT, "Are you sure you want to delete deployment " + stepContext.values.deleteDeploymentId + "?<br><br> <b> WARNING </b>: this action cannot be undone." );
    }

    async retrieveTokenStep(stepContext) {
        
        if (stepContext.result) {
            return await stepContext.beginDialog(OAUTH_PROMPT);
        } else {
            await stepContext.context.sendActivity('Deletion cancelled.')
            return await stepContext.endDialog();
        }
        
    }

    async deleteDeploymentStep(stepContext) {
        if (stepContext.result) {
            await GraphHelpers.deleteDeployment(stepContext, stepContext.result, stepContext.values.deleteDeploymentId);
            return await stepContext.next();
        }
        
        return stepContext.endDialog();
    }

    async sendConfirmationStep(stepContext) {
        console.log("ENTERED HERE????");
        return await stepContext.context.sendActivity("Deployment <b>" + stepContext.values.deleteDeploymentId + "</b> successfully deleted!");
    }
}

module.exports.DeleteDeploymentDialog = DeleteDeploymentDialog;