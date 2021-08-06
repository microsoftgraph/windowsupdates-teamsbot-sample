const { ChoicePrompt, ConfirmPrompt, DialogSet, DialogTurnStatus, OAuthPrompt, WaterfallDialog, TextPrompt, ComponentDialog } = require('botbuilder-dialogs');
const { CHOICE_PROMPT, OAUTH_PROMPT, CONFIRM_PROMPT, TEXT_PROMPT, CREATE_FU_DEPLOYMENT_DIALOG, FEATURE_UPDATE } = require('./dialogConstants');
const { ROLLOUT_OPTIONS, NONE, SET_START, RATE_BASED, RATE_BASED_WITH_START, DATE_BASED, CANCEL,
     SET_START_DIALOG, RATE_BASED_DIALOG, DATE_BASED_DIALOG, RATE_BASED_WITH_START_DIALOG } = require('./dialogConstants');
const { SetStartDateDialog } = require('./rolloutDialogs/setStartDateRolloutDialog');
const { SetRateBasedRolloutDialog } = require('./rolloutDialogs/rateBasedRolloutDialog');
const { SetDateBasedRolloutDialog } = require('./rolloutDialogs/dateBasedRolloutDialog');
const {GraphHelpers} = require('./graph-helpers');
const { LogoutDialog } = require('./logoutDialog');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';


class CreateFUDeploymentDialog extends LogoutDialog {

    constructor() {
        super(CREATE_FU_DEPLOYMENT_DIALOG);
        
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.confirmContentStep.bind(this),
            this.retrieveTokenStep.bind(this),
            this.promptVersionStep.bind(this), 
            this.promptRolloutOptionsStep.bind(this),
            this.setRolloutOptionsStep.bind(this),
            this.confirmDetailsStep.bind(this), 
            this.createDeploymentObject.bind(this)
        ]));

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
            connectionName: process.env.connectionName,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

        this.addDialog(new SetStartDateDialog());
        this.addDialog(new SetRateBasedRolloutDialog());
        this.addDialog(new SetDateBasedRolloutDialog());

        this.initialDialogId = WATERFALL_DIALOG;

        this.rolloutOptions = ROLLOUT_OPTIONS;
    }

    async confirmContentStep(stepContext) {
        return await stepContext.prompt(CONFIRM_PROMPT, 'Are you sure you want to create a <b>feature update </b> deployment?');
    }

    async retrieveTokenStep(stepContext) {
        if (stepContext.result) {
            return await stepContext.beginDialog(OAUTH_PROMPT);
        }
        return stepContext.endDialog();
    }

    async promptVersionStep(stepContext) {
        const tokenResponse = stepContext.result;
        if (tokenResponse) {
            const catalog = await GraphHelpers.getAvailableUpdates(stepContext, tokenResponse, FEATURE_UPDATE);
            if (catalog.length == 0) {
                await stepContext.context.sendActivity('There are no available feature updates at this time.');
                return await stepContext.endDialog();
            }

            // Construct array of available feature updates
            var availableVersions = [];
            catalog.forEach(entry => {
                if (!availableVersions.includes(entry.version)) {
                    availableVersions.push(entry.version);
                }
            });

            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt: 'Choose from among the available feature update versions:', 
                choices: availableVersions, 
                style: 5
            });
        }
        return await stepContext.endDialog();
    }
    
    async promptRolloutOptionsStep(stepContext) {
        if (stepContext.result) {
            const versionNum = stepContext.result.value;
            const deployment = {
                '@odata.type': '#microsoft.graph.windowsUpdates.deployment',
                content: {
                    '@odata.type': 'microsoft.graph.windowsUpdates.featureUpdateReference',
                    version: versionNum
                }
            }
            stepContext.values.newDeployment = deployment;
          
            return await stepContext.prompt(CHOICE_PROMPT, { 
                prompt: 'Choose a rollout option:', 
                choices: this.rolloutOptions, 
                style: 5
            });
        }
        return await stepContext.endDialog();
    }

    async setRolloutOptionsStep(stepContext) {
        const choice = stepContext.result.value;
        switch(choice) {
            case NONE:
                return await stepContext.next();
            case SET_START:
                return await stepContext.beginDialog(SET_START_DIALOG);
            case RATE_BASED:
                return await stepContext.beginDialog(RATE_BASED_DIALOG);
            case RATE_BASED_WITH_START:
                return await stepContext.beginDialog(RATE_BASED_WITH_START_DIALOG);
            case DATE_BASED:
                return await stepContext.beginDialog(DATE_BASED_DIALOG);
            default:
                break;
        }
        return await stepContext.endDialog();
    }

    // rollout settings object gets sent here
    async confirmDetailsStep(stepContext) {
        const rolloutSettings = stepContext.result;
        console.log('[Create FU Deployment] Rollout Settings: ' + JSON.stringify(rolloutSettings));
        if (rolloutSettings) {
            stepContext.values.newDeployment.settings = {};
            stepContext.values.newDeployment.settings['@odata.type'] = 'microsoft.graph.windowsUpdates.windowsDeploymentSettings';
            // Save the rollout settings object from the last step
            stepContext.values.newDeployment.settings.rollout = rolloutSettings;
            return await stepContext.prompt(CONFIRM_PROMPT, 
                'Please Confirm: <br> <b> Feature Update Deployment </b> <br> Version: ' + stepContext.values.newDeployment.content.version + '<br>' +
                JSON.stringify(rolloutSettings));
        } else {
            return await stepContext.prompt(CONFIRM_PROMPT, 
                'Please Confirm: <br> <b> Feature Update Deployment </b> <br> Version: ' + stepContext.values.newDeployment.content.version + '<br>');
        } 
    }

    async createDeploymentObject(stepContext) {
        if (stepContext.result) {
            console.log(JSON.stringify(stepContext.values.newDeployment));
            return await stepContext.endDialog(stepContext.values.newDeployment);
        }
        await stepContext.context.sendActivity("Cancelled deployment creation.");
        return await stepContext.endDialog();
    }
}

module.exports.CreateFUDeploymentDialog = CreateFUDeploymentDialog;