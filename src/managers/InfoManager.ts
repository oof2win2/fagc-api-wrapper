import fetch from "isomorphic-fetch"
import { Webhook } from "fagc-api-types"
import BaseManager from "./BaseManager"
import {
	GenericAPIError,
	RequestConfig,
	NoAuthError,
	DefaultProps,
	ManagerOptions,
	WrapperOptions,
} from "../types"
import strictUriEncode from "strict-uri-encode"
import { APIEmbed } from "discord-api-types"

export default class InfoManager extends BaseManager<Webhook> {
	private apiurl: string

	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
		this.apiurl = options.apiurl
	}
	async addWebhook(
		webhookid: string,
		webhooktoken: string
	): Promise<Webhook> {
		const add = await fetch(`${this.apiurl}/informatics/webhook`, {
			method: "POST",
			body: JSON.stringify({
				id: webhookid,
				token: webhooktoken,
			}),
			credentials: "include",
			headers: { "content-type": "application/json" },
		}).then((w) => w.json())
		if (add.error) throw new GenericAPIError(`${add.error}: ${add.message}`)
		return add
	}
	async removeWebhook(
		webhookid: string,
		webhooktoken: string
	): Promise<Webhook | null> {
		const add = await fetch(`${this.apiurl}/informatics/webhook`, {
			method: "DELETE",
			body: JSON.stringify({
				id: webhookid,
				token: webhooktoken,
			}),
			credentials: "include",
			headers: { "content-type": "application/json" },
		}).then((w) => w.json())
		return add
	}

	async notifyGuildText({
		guildId,
		text,
		reqConfig = {},
	}: {
		guildId: string
		text: string
	} & DefaultProps): Promise<void> {
		if (
			!reqConfig.masterapikey &&
			!this.masterapikey &&
			!reqConfig.communityId &&
			!this.communityId
		)
			throw new NoAuthError()
		const authentication =
			reqConfig?.communityId || this.communityId
				? `Cookie ${reqConfig?.communityId || this.communityId}` // auth method is cookie
				: `Token ${reqConfig?.masterapikey || this.masterapikey}` // auth method is api key
		await fetch(
			`${this.apiurl}/informatics/notify/${strictUriEncode(guildId)}`,
			{
				method: "POST",
				body: JSON.stringify({
					data: text,
				}),
				credentials: "include",
				headers: {
					authorization: authentication,
					"content-type": "application/json",
				},
			}
		)
	}
	async notifyGuildEmbed({
		guildId,
		embed,
		reqConfig = {},
	}: {
		guildId: string
		embed: APIEmbed
	} & DefaultProps): Promise<void> {
		if (
			!reqConfig.masterapikey &&
			!this.masterapikey &&
			!reqConfig.communityId &&
			!this.communityId
		)
			throw new NoAuthError()
		const authentication =
			reqConfig?.communityId || this.communityId
				? `Cookie ${reqConfig?.communityId || this.communityId}` // auth method is cookie
				: `Token ${reqConfig?.masterapikey || this.masterapikey}` // auth method is api key
		await fetch(
			`${this.apiurl}/informatics/notify/${strictUriEncode(
				guildId
			)}/embed`,
			{
				method: "POST",
				body: JSON.stringify(embed),
				credentials: "include",
				headers: {
					authorization: authentication,
					"content-type": "application/json",
				},
			}
		)
	}
}
