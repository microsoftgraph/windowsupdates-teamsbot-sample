const { DATE_TIME_PROMPT, SET_START_DIALOG } = require('../dialogConstants');
const { WaterfallDialog, ComponentDialog, DateTimePrompt } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'MainWaterfallDialog';
class SetStartDateDialog extends ComponentDialog {

    constructor() {
        super(SET_START_DIALOG);
        
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.promptStartDateStep.bind(this),
            this.setStartDateStep.bind(this),
            this.loopIfInvalidStep.bind(this)
        ]));

        this.addDialog(new DateTimePrompt(DATE_TIME_PROMPT));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;

        this.rolloutSettings = new Object();

    }

    async promptStartDateStep(stepContext) {

        return await stepContext.prompt(DATE_TIME_PROMPT, 'When would you like to start offering this deployment? Enter start date in YYYY-MM-DD format.');
    }

    async setStartDateStep(stepContext) {
        const results = stepContext.result;
        const inputdatetime = new Date(results[0].value);
        console.log("Date entered: " + inputdatetime.toISOString());

        const now = Date.now();
        const earliest = now + (60 * 60 * 1000); // One hour from now

        if (earliest <= inputdatetime) { 
            // set the start time in the settings object 
            this.rolloutSettings.startDateTime = inputdatetime.toISOString();
            return await stepContext.endDialog(this.rolloutSettings);
        } else {
            stepContext.context.sendActivity("Please enter a valid datetime that is at least one hour out.")
            return await stepContext.next();
        }
    }

    async loopIfInvalidStep(stepContext) {
        return await stepContext.beginDialog(MAIN_WATERFALL_DIALOG);
    }
    
}
module.exports.SetStartDateDialog = SetStartDateDialog;