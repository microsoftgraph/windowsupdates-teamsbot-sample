// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { Client} = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

/**
 * This class is a wrapper for the Microsoft Graph API.
 * See: https://developer.microsoft.com/en-us/graph for more information.
 */
class SimpleGraphClient {
    constructor(token) {
        if (!token || !token.trim()) {
            throw new Error('SimpleGraphClient: Invalid token received.');
        }

        this._token = token;

        this.graphClient = Client.init({
            authProvider: (done) => {
                done(null, this._token); // First parameter takes an error if you can't get an access token.
            }
        });
    }

    /**
     * Collects information about the user in the bot.
     */
    async getMe() {
        console.log("[SimpleGraphClient] entered the getMe function");
        return await this.graphClient
            .api('/me')
            .get().then((res) => {
                return res;
            });
        
    }

    /**
     * Gets the catalog of available deployable content.
     */
    async getCatalog(content) {
        console.log("[SimpleGraphClient] entered getCatalog function");
        return await this.graphClient.api('/admin/windows/updates/catalog/entries')
            .orderby('releaseDateTime desc')
            .version('beta')
            .get().then((res) => {return res;});
    }


    /**
     * Gets a collection of deployment objects.
     */
    async getDeployments(num) {
        console.log("[SimpleGraphClient] entered getDeployments function");
        return await this.graphClient.api('/admin/windows/updates/deployments')
            .orderby('lastModifiedDateTime desc')
            .top(num)
            .version('beta')
            .get().then((res) => {return res;});
    }

    /**
     * Posts a new deployment to the WUfB DS endpoint.
     */
    async createDeployment(deployment) {
        console.log("[SimpleGraphClient] entered createDeployment function");
        console.log(JSON.stringify(deployment));
          
        return await this.graphClient.api('/admin/windows/updates/deployments')
            .version('beta')
            .post(deployment).then((res) => {return res;});
    }

    /**
     * Deletes an existing deployment.
     */
    async deleteDeployment(deploymentId) {
        console.log("[SimpleGraphClient] entered deleteDeployment function");

        return await this.graphClient.api('/admin/windows/updates/deployments/' + deploymentId)
            .version('beta')
            .delete().then((res) => {return res;});
    }

    async postDeploymentAudienceUpdate(deploymentId, updateAudience) {
        
        console.log("POST deployment audience update request info:");
        console.log(deploymentId);
        console.log(JSON.stringify(updateAudience));
        return await this.graphClient.api('/admin/windows/updates/deployments/' + deploymentId + '/audience/updateAudience')
            .version('beta')
            .post(updateAudience);
    }

    async getAudienceMembers(deploymentId) {
        return await this.graphClient.api('/admin/windows/updates/deployments/' + deploymentId + '/audience/members')
            .version('beta')
            .get().then((res) => {
                return res;
            });
    }
}

exports.SimpleGraphClient = SimpleGraphClient;
