const { DATE_TIME_PROMPT, VALIDATE_DATETIME_DIALOG } = require("./dialogConstants");
const { WaterfallDialog, ComponentDialog, DateTimePrompt } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'MainValidateWaterfallDialog';
class ValidateDateTimeDialog extends ComponentDialog {

    constructor() {
        super(VALIDATE_DATETIME_DIALOG);
        
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.promptDateInputStep.bind(this),
            this.validateDateStep.bind(this),
            this.loopIfInvalidStep.bind(this)
        ]));

        this.addDialog(new DateTimePrompt(DATE_TIME_PROMPT));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;

    }

    async promptDateInputStep(stepContext) {
        const dateTimeName = stepContext.options['name'];
        const earliest = stepContext.options['earliest'];
        stepContext.values.earliest = earliest;
        var name = '';
        var earliestString = '';
        var minFromNow;

        if (dateTimeName) {
            console.log('datetimename: ' + dateTimeName);
            name = dateTimeName;
        }

        if (earliest) {
            console.log('earliest: ' + earliest);
            const now = Date.now();
            minFromNow = Math.ceil((earliest - now) / (1000 * 60));
            stepContext.values.minFromNow = minFromNow;
            earliestString = ' at least ' + minFromNow + ' minutes from now';
        }

        return await stepContext.prompt(DATE_TIME_PROMPT, 'Enter ' + name + ' datetime' + earliestString + '. You may use phrases like "tomorrow at 9am"'); 
        
    }

    async validateDateStep(stepContext) {
        const results = stepContext.result;
        const inputdatetime = new Date(results[0].value);
        console.log("Date entered: " + inputdatetime.toISOString());

        const earliest = new Date(stepContext.values.earliest);

        if (earliest <= inputdatetime) { 
            return await stepContext.endDialog(inputdatetime.toISOString());
        } else {
            stepContext.context.sendActivity("Please enter a valid datetime that is at least " + stepContext.values.minFromNow + " minutes out.")
            return await stepContext.next();
        }
    }

    async loopIfInvalidStep(stepContext) {
        return await stepContext.beginDialog(MAIN_WATERFALL_DIALOG);
    }
    
}
module.exports.ValidateDateTimeDialog = ValidateDateTimeDialog;