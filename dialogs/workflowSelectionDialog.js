// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { ChoicePrompt, OAuthPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { WORKFLOW_SELECTION_DIALOG, OAUTH_PROMPT, CHOICE_PROMPT, 
    WORKFLOW_COMMANDS, CREATE_DEPLOYMENT_DIALOG, 
    GET_DEPLOYMENTS, CREATE_FU_DEPLOYMENT, CREATE_XS_DEPLOYMENT, ADD_AUDIENCE, FEATURE_UPDATE, EXP_SECURITY_UPDATE, UPDATE_AUDIENCE_DIALOG, ADD_DEVICES, DELETE_DEPLOYMENT_DIALOG, DELETE_DEPLOYMENT, LOGOUT } = require('./dialogConstants');
const { CreateDeploymentMainDialog } = require('./createDeploymentDialog');
const { GraphHelpers } = require('./graph-helpers');
const { UpdateDeploymentAudienceDialog } = require('./updateDeploymentAudienceDialog');
const { DeleteDeploymentDialog } = require('./deleteDeploymentDialog');
const { LogoutDialog } = require('./logoutDialog');
const NUM_DEPLOYMENTS_SHOWN = 5;
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class WorkflowSelectionDialog extends LogoutDialog {
    constructor() {
        super(WORKFLOW_SELECTION_DIALOG);

        this.workflowOptions = WORKFLOW_COMMANDS;

        // OAuth Prompt
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
            connectionName: process.env.connectionName,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new CreateDeploymentMainDialog());

        this.addDialog(new UpdateDeploymentAudienceDialog());

        this.addDialog(new DeleteDeploymentDialog());

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.initialRetrieveTokenStep.bind(this),
            this.selectionStep.bind(this),
            this.retrieveTokenStep.bind(this),
            this.executeSelectionStep.bind(this), 
            this.loopStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initialRetrieveTokenStep(stepContext) {
        return await stepContext.beginDialog(OAUTH_PROMPT);
    }

    async selectionStep(stepContext) {
        const tokenResponse = stepContext.result;
        if (tokenResponse) {
            const deployments = await GraphHelpers.getDeployments(stepContext, tokenResponse, NUM_DEPLOYMENTS_SHOWN);
            var options = [];
           
            if (deployments.length <= 0) {
                await stepContext.context.sendActivity('You have no current deployments. To proceed, create either a new feature update deployment or an expedited security update deployment.');
                options = [CREATE_FU_DEPLOYMENT, CREATE_XS_DEPLOYMENT, LOGOUT];
            } else {
                const tableHTML = await GraphHelpers.getDeploymentsTable(stepContext, tokenResponse, NUM_DEPLOYMENTS_SHOWN);
                await stepContext.context.sendActivity('Here are your ' + NUM_DEPLOYMENTS_SHOWN + ' most recently modified deployments: <br>');
                var message = {
                    type: 'message',
                    textFormat: 'xml',
                    text: tableHTML
                };
                await stepContext.context.sendActivity(message);
                options = this.workflowOptions;
            }
            
            // Prompt the user for a choice.
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt: 'Here are your available workflows.',
                retryPrompt: 'Please choose an option from the list.',
                choices: options, 
                style: 5
            });
        }
        return await stepContext.endDialog();
        
    }

    async retrieveTokenStep(stepContext) {
        stepContext.values.currentWorkflow = stepContext.result;

        return await stepContext.beginDialog(OAUTH_PROMPT);
    }

    async executeSelectionStep(stepContext) {
        const choice = stepContext.values.currentWorkflow;
        const tokenResponse = stepContext.result;
        console.log(choice);
        switch (choice.value) {
            case GET_DEPLOYMENTS:
                
                const tableHTML = await GraphHelpers.getDeploymentsTable(stepContext.context, tokenResponse, 5);

                var message = {
                    type: 'message',
                    textFormat: 'xml',
                    text: tableHTML
                };
                await stepContext.context.sendActivity(message);
                break;
            case CREATE_FU_DEPLOYMENT:
                return await stepContext.beginDialog(CREATE_DEPLOYMENT_DIALOG, {content: FEATURE_UPDATE});
            case CREATE_XS_DEPLOYMENT:
                return await stepContext.beginDialog(CREATE_DEPLOYMENT_DIALOG, {content: EXP_SECURITY_UPDATE});
            case ADD_AUDIENCE:
                return await stepContext.beginDialog(UPDATE_AUDIENCE_DIALOG, {action: ADD_DEVICES});
            case DELETE_DEPLOYMENT:
                return await stepContext.beginDialog(DELETE_DEPLOYMENT_DIALOG);
            case LOGOUT:
            default:
                return await stepContext.endDialog();
        }  

        return await stepContext.next();
    } 

    async loopStep(stepContext) {
        return await stepContext.beginDialog(WATERFALL_DIALOG);
    }
    
}

module.exports.WorkflowSelectionDialog = WorkflowSelectionDialog;