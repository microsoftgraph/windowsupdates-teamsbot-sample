// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { WaterfallDialog, ComponentDialog, TextPrompt, OAuthPrompt } = require('botbuilder-dialogs');
const { UPDATE_AUDIENCE_DIALOG, TEXT_PROMPT, OAUTH_PROMPT } = require("./dialogConstants");
const { GraphHelpers } = require('./graph-helpers');
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class UpdateDeploymentAudienceDialog extends ComponentDialog {
    constructor (action, deploymentId) {
        super(UPDATE_AUDIENCE_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
            connectionName: process.env.connectionName,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.promptDeploymentId.bind(this),
            this.promptDevicesStep.bind(this),
            this.retrieveTokenStep.bind(this),
            this.processDeviceIds.bind(this), 
            this.confirmSuccess.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async promptDeploymentId(stepContext) {
        this.action = stepContext.options['action'];
        this.deploymentId = stepContext.options['deploymentId'];

        if (!this.deploymentId) {
            return await stepContext.prompt(TEXT_PROMPT, "Tell me which deployment by ID you want to add devices to:  ");
        } else {
            return await stepContext.next();
        }

    }

    async promptDevicesStep(stepContext) {
        if (stepContext.result) {
            console.log('this is what i got: ' + stepContext.result);
            this.deploymentId = stepContext.result.trim();
            console.log('after trim: ' + this.deploymentId);
        }
        return await stepContext.prompt(TEXT_PROMPT, 'Please enter the Azure device IDs of the devices you wish to target. <br><br>' + 
            'IMPORTANT: Separate individual IDs by whitespace (space, tab, or new line). You may wish to format it elsewhere and copy and paste into the textbox');
    }

    async retrieveTokenStep(stepContext) {
        if (stepContext.result) {
            this.devices = stepContext.result.split(/\s+/);
        }
        
        console.log("Processed devices: ");
        console.log(this.devices);

        return await stepContext.beginDialog(OAUTH_PROMPT);


    }

    async processDeviceIds(stepContext) {
        if (stepContext.result) {
            this.devicesProcessed = await GraphHelpers.updateDeploymentAudience(stepContext, stepContext.result, this.deploymentId, this.action, this.devices);
            return await stepContext.next();
        }
        else {
            return await stepContext.endDialog();  
        }
    }

    async confirmSuccess(stepContext) {
        return await stepContext.context.sendActivity(this.devicesProcessed + " devices were added to deployment " + this.deploymentId + ".");
    }
}

module.exports.UpdateDeploymentAudienceDialog = UpdateDeploymentAudienceDialog;