// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { DATE_BASED_DIALOG, NUMBER_PROMPT, VALIDATE_DATETIME_DIALOG, TEXT_PROMPT } = require('../dialogConstants');
const { NumberPrompt, ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { ValidateDateTimeDialog } = require('../validateDatetimeDialog');

const WATERFALL_DIALOG = 'DateBasedWaterfallDialog';

class SetDateBasedRolloutDialog extends ComponentDialog {

    constructor() {
        super(DATE_BASED_DIALOG);
        
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.promptStartDate.bind(this),
            this.promptEndDate.bind(this),
            this.finishSettingRolloutSettings.bind(this)
        ]));

        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new ValidateDateTimeDialog());

        this.initialDialogId = WATERFALL_DIALOG;

    }

    async promptStartDate(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT, "When would you like to <b>start</b> offering this deployment (enter in YYYY-MM-DD format)?");
    }

    async promptEndDate(stepContext) {
        stepContext.values.startDateTime = new Date(stepContext.result.split("-")).toISOString();

        return await stepContext.prompt(TEXT_PROMPT, "When would you like to <b>finish</b> offering this deployment (enter in YYYY-MM-DD format)?");
    }

    async finishSettingRolloutSettings(stepContext) {
        var rolloutSettings = new Object();
        rolloutSettings.startDateTime = stepContext.values.startDateTime;
        rolloutSettings.endDateTime = new Date(stepContext.result.split("-")).toISOString();

        return await stepContext.endDialog(rolloutSettings);

    }

}
module.exports.SetDateBasedRolloutDialog = SetDateBasedRolloutDialog;