const { RATE_BASED_DIALOG, NUMBER_PROMPT } = require('../dialogConstants');
const { NumberPrompt, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'RateBasedWaterfallDialog';

class SetRateBasedRolloutDialog extends ComponentDialog {

    constructor() {
        super(RATE_BASED_DIALOG);
        
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.promptDevicesPerOffer.bind(this),
            this.promptDurationBetweenOffers.bind(this),
            this.finishSettingRolloutSetting.bind(this)
        ]));

        this.addDialog(new NumberPrompt(NUMBER_PROMPT));

        this.initialDialogId = WATERFALL_DIALOG;

        this.rolloutSettings = new Object();

    }

    async promptDevicesPerOffer(stepContext) {
        return await stepContext.prompt(NUMBER_PROMPT, 'How many devices would you like to offer this update to at a time?');
    }

    async promptDurationBetweenOffers(stepContext) {
        this.rolloutSettings.devicesPerOffer = stepContext.result;
        return await stepContext.prompt(NUMBER_PROMPT, 'How many days would you like to have between offers?');
    }

    async finishSettingRolloutSetting(stepContext) {
        const durBtwnOffersString = 'P' + stepContext.result + 'D';
        this.rolloutSettings.durationBetweenOffers = durBtwnOffersString;
        return await stepContext.endDialog(this.rolloutSettings);
    }
}
module.exports.SetRateBasedRolloutDialog = SetRateBasedRolloutDialog;