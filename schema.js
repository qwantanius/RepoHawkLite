const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type YmlFile {
        ymlFileName: String
        ymlFileRelativePath: String
        ymlFileContent: String
    }

    type BranchInfo {
        branchName: String
        totalAmountOfFiles: Int
        totalSize: Int
        amountOfYmlFiles: Int
        ymlFiles: [YmlFile]
    }

    type RepositoryInfo {
        reponame: String
        size: Int
        owner: String
        isPrivate: Boolean
        totalFiles: Int
        branches: [BranchInfo]
        webhooks: [Webhook]
    }

    type WebhookConfig {
        url: String
    }

    type Webhook {
        id: ID
        name: String
        active: Boolean
        config: WebhookConfig
    }

    type Query {
        repository(apiToken: String!): [RepositoryInfo]
    }
`);

module.exports = schema;
