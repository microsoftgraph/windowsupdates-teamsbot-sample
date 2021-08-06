const { SimpleGraphClient } = require('./simple-graph-client');
const { EXP_SECURITY_UPDATE, FEATURE_UPDATE, ADD_DEVICES, REMOVE_DEVICES } = require('./dialogConstants');
/**
 * These methods call the Microsoft Graph API. The following OAuth scopes are used:
 * 'openid' 'profile' 'User.Read', 'WindowsUpdate.ReadWrite.All'
 * for more information about scopes see:
 * https://developer.microsoft.com/en-us/graph/docs/concepts/permissions_reference
 */
 class GraphHelpers {
    /**
     * Send the user their Graph Display Name from the bot.
     * @param {TurnContext} context A TurnContext instance containing all the data needed for processing this conversation turn.
     * @param {TokenResponse} tokenResponse A response that includes a user token.
     */
    static async listMe(context, tokenResponse) {
        if (!context) {
            throw new Error('OAuthHelpers.listMe(): `context` cannot be undefined.');
        }
        if (!tokenResponse || !tokenResponse.token) {
            throw new Error('OAuthHelpers.listMe(): `tokenResponse` cannot be undefined.');
        }

        // Pull in the data from Microsoft Graph.
        const client = new SimpleGraphClient(tokenResponse.token);
        const me = await client.getMe();

        await context.sendActivity(`You are ${ me.displayName }.`);
    }

    static async getAvailableUpdates(context, tokenResponse, content) {
        if (!context) {
            throw new Error('OAuthHelpers.getAvailableUpdates(): `context` cannot be undefined.');
        }
        if (!tokenResponse || !tokenResponse.token) {
            throw new Error('OAuthHelpers.getAvailableUpdates(): `tokenResponse` cannot be undefined.');
        }

        const client = new SimpleGraphClient(tokenResponse.token);
        const response = await client.getCatalog(content);

        var catalogEntries = response.value;

        switch (content) {
            case EXP_SECURITY_UPDATE:
                var securityUpdates = []; 
                catalogEntries.forEach(entry => {
                    if (entry['@odata.type'] == '#microsoft.graph.windowsUpdates.qualityUpdateCatalogEntry' 
                            && entry.qualityUpdateClassification == 'security'
                            && entry.isExpeditable) {
                        securityUpdates.push(entry);
                    }
                });
                return securityUpdates;
            case FEATURE_UPDATE:
                var featureUpdates = [];
                catalogEntries.forEach(entry => {
                    if (entry['@odata.type'] == "#microsoft.graph.windowsUpdates.featureUpdateCatalogEntry") {
                        featureUpdates.push(entry);
                    }
                });
                return featureUpdates;
            default:
                return catalogEntries;
        }
    }

    static async getDeployments(context, tokenResponse, num) {
        if (!context) {
            throw new Error('OAuthHelpers.getDeployments(): `context` cannot be undefined.');
        }
        if (!tokenResponse || !tokenResponse.token) {
            throw new Error('OAuthHelpers.getDeployments(): `tokenResponse` cannot be undefined.');
        }

        const client = new SimpleGraphClient(tokenResponse.token);
        const response = await client.getDeployments(num);

        console.log('response: ');
        console.log(JSON.stringify(response));
        return response.value;
    }


    static async getDeploymentsTable(context, tokenResponse, num) {
        if (!context) {
            throw new Error('OAuthHelpers.getDeploymentsTable(): `context` cannot be undefined.');
        }
        if (!tokenResponse || !tokenResponse.token) {
            throw new Error('OAuthHelpers.getDeploymentsTable(): `tokenResponse` cannot be undefined.');
        }

        const client = new SimpleGraphClient(tokenResponse.token);
        const response = await client.getDeployments(num);

        /**
         * CREATE THE TABLE
         * 
         *  | Deployment ID | Content Type | State | Time Created | Last Modified | Audience |
         */
        var tableData = response.value;
        // await console.log(tableData);
        var tableHTML = '<table style=”padding:100px;width:750px;border:100px white;”> <tr style=”background-color:#c6c6c6">' + 
                                '<th>Deployment ID</th><th>Content Type</th><th>State</th><th>Created</th><th>Last Modified</th><th>Audience</th></tr>';
        for (let i = 0; i < tableData.length; i++) {
   
            const id = tableData[i].id;
            const fullContentName = tableData[i].content["@odata.type"].toLowerCase();
            var content;
      
            // Set content column
            if (fullContentName.includes('featureupdatereference')) {
                content = 'FU';
            } else if (fullContentName.includes('expeditedqualityupdatereference')) {
                content = 'exp. QU (security)'
            }


            const state = tableData[i].state["value"];
            const created = tableData[i].createdDateTime.substr(0,10);
            const modified = tableData[i].lastModifiedDateTime.substr(0, 10);

            // Construct audience list
            const audience = (await client.getAudienceMembers(id)).value;

            var audienceIds = [];
            if (audience.length > 0) {
                for (let j = 0; j < 3; j++) {
                    audienceIds.push(audience[j].id.substr(0,4) + '...');
                }

                const diff = audience.length - audienceIds.length;
                var extra = '';
                if (diff > 0) {
                    extra = '+' + diff;
                }
                tableHTML += '<tr ><td>' + id + '</td><td>' + content + 
                '</td><td>' + state + '</td><td>' + created + 
                '</td><td>' + modified + '</td><td>' + audienceIds + extra + '</td></tr>';
            } else {
                tableHTML += '<tr ><td>' + id + '</td><td>' + content + 
                '</td><td>' + state + '</td><td>' + created + 
                '</td><td>' + modified + '</td><td>' + 'N/A' + '</td></tr>';
            }
        }

        tableHTML += '</table>';
        return tableHTML;
    }

    static async createDeployment(context, tokenResponse, deployment) {
        if (!context) {
            throw new Error('OAuthHelpers.createDeployment(): `context` cannot be undefined.');
        }
        if (!tokenResponse || !tokenResponse.token) {
            throw new Error('OAuthHelpers.createDeployment(): `tokenResponse` cannot be undefined.');
        }

        const client = new SimpleGraphClient(tokenResponse.token);
        const response = await client.createDeployment(deployment);
        return response.id;
    }

    static async deleteDeployment(context, tokenResponse, deploymentId) {
        if (!context) {
            throw new Error('OAuthHelpers.deleteDeployment(): `context` cannot be undefined.');
        }
        if (!tokenResponse || !tokenResponse.token) {
            throw new Error('OAuthHelpers.deleteDeployment(): `tokenResponse` cannot be undefined.');
        }

        const client = new SimpleGraphClient(tokenResponse.token);
        return await client.deleteDeployment(deploymentId);
    }

    static async updateDeploymentAudience(context, tokenResponse, deploymentId, action, devices) {
        if (!context) {
            throw new Error('OAuthHelpers.updateDeploymentAudience(): `context` cannot be undefined.');
        }
        if (!tokenResponse || !tokenResponse.token) {
            throw new Error('OAuthHelpers.updateDeploymentAudience(): `tokenResponse` cannot be undefined.');
        }
        var updateAudience = {}
        var members = [];

        devices.forEach( (deviceId) => {
            if (deviceId != '') {
                members.push({
                    '@odata.type': '#microsoft.graph.windowsUpdates.azureADDevice',
                    id: deviceId
                });
            }
        });

        switch(action) {
            case ADD_DEVICES:
                updateAudience.addMembers = members;
                break;
            case REMOVE_DEVICES:
                updateAudience.removeMembers = members;
                break;
            default:
                return;
        }

        console.log(updateAudience);

        const client = new SimpleGraphClient(tokenResponse.token);
        const response = await client.postDeploymentAudienceUpdate(deploymentId, updateAudience);
    
        return members.length;
    }

}

exports.GraphHelpers = GraphHelpers;