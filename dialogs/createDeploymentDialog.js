// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { ChoicePrompt, ConfirmPrompt, DialogSet, DialogTurnStatus, OAuthPrompt, WaterfallDialog, TextPrompt, ComponentDialog} = require('botbuilder-dialogs');
const { CHOICE_PROMPT, CONFIRM_PROMPT, OAUTH_PROMPT, CREATE_DEPLOYMENT_DIALOG, CREATE_FU_DEPLOYMENT_DIALOG, CREATE_XS_DEPLOYMENT_DIALOG, FEATURE_UPDATE, EXP_SECURITY_UPDATE, ADD_DEVICES, UPDATE_AUDIENCE_DIALOG } = require('./dialogConstants');
const { LogoutDialog } = require('./logoutDialog');
const { CreateFUDeploymentDialog } = require('./createFUDeploymentDialog');
const { CreateXSDeploymentDialog } = require('./createXSDeploymentDialog');
const { GraphHelpers } = require('./graph-helpers.js');
const { UpdateDeploymentAudienceDialog } = require('./updateDeploymentAudienceDialog');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';


class CreateDeploymentMainDialog extends LogoutDialog {
    constructor () {
        super(CREATE_DEPLOYMENT_DIALOG);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.setDeploymentContentStep.bind(this),
            this.retrieveTokenStep.bind(this),
            this.postDeploymentStep.bind(this),
            this.addAudienceStep.bind(this), 
            this.finishDeploymentCreationStep.bind(this)
        ]));
      
        this.addDialog(new CreateFUDeploymentDialog());
        this.addDialog(new CreateXSDeploymentDialog());
        this.addDialog(new UpdateDeploymentAudienceDialog());
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
            connectionName: process.env.connectionName,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async setDeploymentContentStep(stepContext) {
        const contentType = stepContext.options["content"];
        switch(contentType) {
            case FEATURE_UPDATE: //feature update
                return await stepContext.beginDialog(CREATE_FU_DEPLOYMENT_DIALOG);
            case EXP_SECURITY_UPDATE: //expedited security update
                return await stepContext.beginDialog(CREATE_XS_DEPLOYMENT_DIALOG);
            default:
                break;
        }
        return await stepContext.endDialog();
    }

    async retrieveTokenStep(stepContext) {
        if (stepContext.result) {
            stepContext.values.newDeployment = stepContext.result;
            return await stepContext.beginDialog(OAUTH_PROMPT);
        }
        return await stepContext.endDialog();
    }

    async postDeploymentStep(stepContext) {
        if (stepContext.result) {
            const tokenResponse = stepContext.result;
            stepContext.values.token = tokenResponse;
            console.log(stepContext.values.newDeployment);
            const new_id = await GraphHelpers.createDeployment(stepContext, tokenResponse, stepContext.values.newDeployment);
            console.log('posted deployment');
            stepContext.values.newDeploymentId = new_id;
            return await stepContext.prompt(CONFIRM_PROMPT, 'Successfully created deployment with ID <b>' + new_id + '</b>. <br><br> Do you want to add target devices with this deployment now? This can also be done later.');
        }
        return await stepContext.endDialog();
    }

    async addAudienceStep(stepContext) {
        if (stepContext.result) {
            return await stepContext.beginDialog(UPDATE_AUDIENCE_DIALOG, {action: ADD_DEVICES, deploymentId: stepContext.values.newDeploymentId});
        }
        return await stepContext.next();
    }

    async finishDeploymentCreationStep(stepContext) {
        var text = '<header>Deployment creation successful!</header>'
        var message = {
            type: 'message',
            textFormat: 'xml',
            text: text
        };
        return await stepContext.context.sendActivity(message);


        // Deployment Creation Successful!
        // Content: FU or QSU
        // ID:
        // Audience:
        // return await stepContext.context.sendActivity()
    }
}
module.exports.CreateDeploymentMainDialog = CreateDeploymentMainDialog;
