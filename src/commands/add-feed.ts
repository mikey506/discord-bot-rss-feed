import { Message } from "../models/message"
import { DisharmonyClient, Command, PermissionLevel } from "disharmony"
import { Feed } from "../models/feed";
import { generate as GenerateID } from "shortid"
import { parse as ParseUrl } from "url"

async function invoke(params: string[], message: Message, client: DisharmonyClient)
{
    //validate and retrieve channel ID
    if (message.mentions.channels.size === 0)
        throw new Error("Invalid channel")
    const channelID = message.mentions.channels.first().id

    //validate and retrieve feed URL
    const url = params[0]
    if (!isValid(url))
        throw new Error("Invalid URL")

    //retrieve (optional) roleID
    let roleID = ""
    if (message.mentions.roles.size > 0)
        roleID = message.mentions.roles.first().id

    //retrieve and validate against existing feeds for this channel
    const feeds = message.guild.channels.get(channelID)!.feeds
    if (feeds.find(x => x.url == url))
        throw new Error("Feed already exists")

    //add new feed
    let newFeed = new Feed()
    newFeed.id = GenerateID()
    newFeed.url = url
    newFeed.roleID = roleID

    //request confirmation
    const response = await Message.ask(
        client, message.channelID,
        `Are you happy with this? (y/n)\n${newFeed.toString()}`,
        message.member, true
    )

    message.reply("Please wait while I validate the RSS feed")

    //todo inject a feed reader somehow...

    if (response.content.toLowerCase() === "n")
        return "Your feed has not been saved"
    else
    {
        feeds.push(newFeed)
        return "Your new feed has been saved!"
    }
}

module.exports = new Command(
    /*name*/            "add-feed",
    /*description*/     "Add an RSS feed to a channel, with optional role tagging",
    /*syntax*/          "add-feed <url> <#channel> [@role]",
    /*permissionLevel*/ PermissionLevel.Anyone,
    /*invoke*/          invoke
)

function isValid(url: string): boolean
{
    return !!ParseUrl(url).hostname
}