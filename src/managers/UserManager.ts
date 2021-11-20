import fetch from "isomorphic-fetch"
import {
	ManagerOptions,
	RequestConfig,
	WrapperOptions,
	DefaultProps,
	NoAuthError,
} from "../types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { GenericAPIError } from ".."
import { User } from "fagc-api-types"

export default class UserManager extends BaseManager<null> {
	private apiurl: string
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		this.apiurl = options.apiurl
	}
	async fetchUser({
		discordUserId,
	}: {
		discordUserId: string
	}): Promise<User | null> {
		const fetched = await fetch(
			`${this.apiurl}/users/${strictUriEncode(discordUserId)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())
		if (fetched.error) throw new GenericAPIError(fetched)

		return fetched
	}

	async addUserToCommunity({
		discordUserId,
		config = {},
		reqConfig,
	}: {
		discordUserId: string
		config: {
			reports?: boolean
			config?: boolean
			notifications?: boolean
		}
	} & DefaultProps): Promise<User | null> {
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
				: `Token ${reqConfig?.apikey || this.apikey}` // auth method is api key
		const fetched = await fetch(
			`${this.apiurl}/users/addUserToCommunity/${strictUriEncode(
				discordUserId
			)}`,
			{
				method: "POST",
				body: JSON.stringify(config),
				credentials: "include",
				headers: {
					authorization: authentication,
					"content-type": "application/json",
				},
			}
		).then((c) => c.json())
		if (fetched.error) throw new GenericAPIError(fetched)
		return fetched
	}

	async removeUserFromCommunity({
		discordUserId,
		reqConfig,
	}: {
		discordUserId: string
	} & DefaultProps): Promise<User | null> {
		const fetched = await fetch(
			`${this.apiurl}/users/removeUserFromCommunity/${strictUriEncode(
				discordUserId
			)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: `Token ${reqConfig.apikey || this.apikey}`,
				},
			}
		).then((c) => c.json())
		if (fetched.error) throw new GenericAPIError(fetched)
		return fetched
	}

	async getsignupurl(): Promise<string> {
		const fetched = await fetch(`${this.apiurl}/users/signupurl`, {
			credentials: "include",
		}).then((c) => c.json())
		if (fetched.error || !fetched.url) throw new GenericAPIError(fetched)
		return fetched.url
	}

	async signup({
		code,
		state,
	}: {
		code: string
		state: string
	}): Promise<User | null> {
		const fetched = await fetch(
			`${this.apiurl}/users/signup?code=${strictUriEncode(
				code
			)}&state=${strictUriEncode(state)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())
		if (fetched.error) throw new GenericAPIError(fetched)
		return fetched
	}
	async login(): Promise<User | null> {
		const fetched = await fetch(`${this.apiurl}/users/login`, {
			credentials: "include",
		}).then((c) => c.json())
		if (fetched.error) throw new GenericAPIError(fetched)
		return fetched
	}
	async logout(): Promise<null> {
		await fetch(`${this.apiurl}/users/logout`, {
			credentials: "include",
		}).then((c) => c.json())
		return null
	}
}
