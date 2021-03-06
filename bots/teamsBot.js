// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { DialogBot } = require('./dialogBot');

class TeamsBot extends DialogBot {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('<b> Welcome to the Windows Update for Business Deployment Service Teams Bot!</b> <br><br>' + 
                    'Type anything to get started, or choose \'Get Started\' from the command menu below.');
                }
            }

            await next();
        });

    }

    async handleTeamsSigninVerifyState(context, state) {
        await this.dialog.run(context, this.dialogState);
    }
}

module.exports.TeamsBot = TeamsBot;
