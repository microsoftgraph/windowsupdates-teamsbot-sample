// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const { ComponentDialog } = require('botbuilder-dialogs');

class LogoutDialog extends ComponentDialog {
    constructor(id, connectionName) {
        super(id);
        this.connectionName = connectionName;
    }

    async onBeginDialog(innerDc, options) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }

        return await super.onBeginDialog(innerDc, options);
    }

    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }

        return await super.onContinueDialog(innerDc);
    }

    async interrupt(innerDc) {
        if (innerDc.context.activity.type === ActivityTypes.Message) {
            const text = innerDc.context.activity.text.toLowerCase();
            if (text === 'logout') {
                console.log('entered the logout case');
                // The bot adapter encapsulates the authentication processes.
                const botAdapter = innerDc.context.adapter;
                await botAdapter.signOutUser(innerDc.context, this.connectionName);
                await innerDc.context.sendActivity('You have been signed out. Thanks for using WUfB DS. See you next time!');
                return await innerDc.cancelAllDialogs();
            }

            if (text === 'cancel') {
                console.log("CANCEL CASE");
            }
        }
    }
}

module.exports.LogoutDialog = LogoutDialog;
