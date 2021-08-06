// Content Types
module.exports.FEATURE_UPDATE = 'Feature Update';
module.exports.EXP_SECURITY_UPDATE = 'Expedited Security Update';

// Prompt IDs and Dialog IDs
module.exports.CHOICE_PROMPT = 'ChoicePrompt';
module.exports.CONFIRM_PROMPT = 'ConfirmPrompt';
module.exports.TEXT_PROMPT = 'TextPrompt';
module.exports.OAUTH_PROMPT = 'OAuthPrompt';
module.exports.DATE_TIME_PROMPT = 'DateTimePrompt';
module.exports.NUMBER_PROMPT = 'NumberPrompt';
module.exports.WORKFLOW_SELECTION_DIALOG = 'SelectWorkflowDialog';
module.exports.CREATE_DEPLOYMENT_DIALOG = 'CreateDeploymentWaterfallDialog';
module.exports.CREATE_FU_DEPLOYMENT_DIALOG = 'CreateFeatureUpdateDeploymentDialog';
module.exports.CREATE_XS_DEPLOYMENT_DIALOG = 'CreateExpeditedSecurityUpdateDeployment_Dialog';
module.exports.SET_START_DIALOG = 'SetStartDateDialog';
module.exports.RATE_BASED_DIALOG = 'RateBasedRolloutDialog';
module.exports.DATE_BASED_DIALOG = 'DateBasedRolloutDialog';
module.exports.RATE_BASED_WITH_START_DIALOG = 'RateBasedWithStartDateTimeDialog';
module.exports.VALIDATE_DATETIME_DIALOG = 'ValidateDateTimeDialog';
module.exports.UPDATE_AUDIENCE_DIALOG = 'UpdateAudienceDialog';
module.exports.DELETE_DEPLOYMENT_DIALOG = 'DeleteDeploymentDialog';

// Workflow Commands
const GET_DEPLOYMENTS = 'Get deployments'
module.exports.GET_DEPLOYMENTS = GET_DEPLOYMENTS;
const CREATE_FU_DEPLOYMENT = 'Create new feature update deployment';
module.exports.CREATE_FU_DEPLOYMENT = CREATE_FU_DEPLOYMENT;
const CREATE_XS_DEPLOYMENT = 'Create new expedited security deployment';
module.exports.CREATE_XS_DEPLOYMENT = CREATE_XS_DEPLOYMENT;
const ADD_AUDIENCE = 'Add audience to existing deployment';
module.exports.ADD_AUDIENCE = ADD_AUDIENCE;
module.exports.ADD_DEVICES = 'Add devices';
module.exports.REMOVE_DEVICES = 'Remove devices';
const DELETE_DEPLOYMENT = 'Delete an existing deployment';
module.exports.DELETE_DEPLOYMENT = DELETE_DEPLOYMENT;
const LOGOUT = 'Logout';
module.exports.LOGOUT = LOGOUT;
module.exports.WORKFLOW_COMMANDS = [GET_DEPLOYMENTS, CREATE_FU_DEPLOYMENT, CREATE_XS_DEPLOYMENT, ADD_AUDIENCE, DELETE_DEPLOYMENT, LOGOUT]

// Feature Update Rollout Options
const NONE = 'None';
module.exports.NONE = NONE;
const RATE_BASED = 'Rate-based Gradual Rollout';
module.exports.RATE_BASED = RATE_BASED;
const DATE_BASED = 'Date-based Gradual Rollout';
module.exports.DATE_BASED = DATE_BASED;
const RATE_BASED_WITH_START = 'Rate-based Gradual Rollout with Start Datetime';
module.exports.RATE_BASED_WITH_START = RATE_BASED_WITH_START;
const SET_START = 'Set Start Datetime';
module.exports.SET_START = SET_START;
const CANCEL = 'Cancel';
module.exports.CANCEL = CANCEL;
module.exports.ROLLOUT_OPTIONS = [NONE, SET_START, RATE_BASED, DATE_BASED];
