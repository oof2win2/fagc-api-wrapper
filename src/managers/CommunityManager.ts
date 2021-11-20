import fetch from "isomorphic-fetch"
import {
	ManagerOptions,
	RequestConfig,
	WrapperOptions,
	DefaultProps,
	GenericAPIError,
	NoAuthError,
} from "../types/"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"
import { Community, GuildConfig, ApiID } from "fagc-api-types"

type SetGuildConfig = Partial<GuildConfig>
type SetCommunityConfig = Partial<Omit<Community, "id">>

export default class CommunityManager extends BaseManager<Community> {
	private apiurl: string

	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
		this.apiurl = options.apiurl
	}
	async fetchCommunity({
		communityId,
		cache = true,
		force = false,
	}: {
		communityId: ApiID
		cache?: boolean
		force?: boolean
	}): Promise<Community | null> {
		if (!force) {
			const cached =
				this.cache.get(communityId) ||
				this.fetchingCache.get(communityId)
			if (cached) return cached
		}

		let promiseResolve: (value: unknown) => void
		const fetchingPromise: Promise<Community | null> = new Promise(
			(resolve) => {
				promiseResolve = resolve
			}
		)

		this.fetchingCache.set(communityId, fetchingPromise)

		const fetched = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(communityId)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (!fetched) return null // return null if the fetch is empty
		if (fetched.error)
			throw new GenericAPIError(`${fetched.error}: ${fetched.message}`)
		if (cache) this.add(fetched)
		promiseResolve(fetched)
		setTimeout(() => {
			this.fetchingCache.sweep((data) => typeof data.then === "function")
		}, 0)
		return fetched
	}
	async fetchAll({
		cache = true,
	}: {
		cache?: boolean
	} = {}): Promise<Community[]> {
		const allCommunities = await fetch(`${this.apiurl}/communities`, {
			credentials: "include",
		}).then((c) => c.json())

		if (allCommunities.error)
			throw new GenericAPIError(
				`${allCommunities.error}: ${allCommunities.message}`
			)

		if (cache && allCommunities[0]) {
			return allCommunities.map((community) => {
				return this.add(community)
			})
		}
		return allCommunities
	}

	async fetchOwnCommunity({
		cache = true,
		reqConfig = {},
	}: {
		cache?: boolean
	} & DefaultProps): Promise<Community | null> {
		if (
			!reqConfig?.apikey &&
			!this.apikey &&
			!reqConfig?.communityId &&
			!this.communityId
		)
			throw new NoAuthError()
		const authentication =
			reqConfig?.communityId || this.communityId
				? `Cookie ${reqConfig?.communityId || this.communityId}` // auth method is cookie
				: `Token ${reqConfig?.apikey || this.apikey}` // auth method is api key
		const community = await fetch(`${this.apiurl}/communities/getown`, {
			credentials: "include",
			headers: {
				authorization: authentication,
			},
		}).then((c) => c.json())

		if (!community) return null

		if (community.error)
			throw new GenericAPIError(
				`${community.error}: ${community.message}`
			)

		if (cache) this.add(community)
		return community
	}
	resolveID(communityId: string): Community | null {
		console.log(this.apikey, "RESOLVE")
		const cached = this.cache.get(communityId)
		if (cached) return cached
		return null
	}
	async fetchGuildConfig({
		guildId,
	}: {
		guildId: string
	}): Promise<GuildConfig | null> {
		const config = await fetch(
			`${this.apiurl}/communities/guildconfig/${strictUriEncode(
				guildId
			)}`,
			{
				credentials: "include",
			}
		).then((c) => c.json())

		if (config.error)
			throw new GenericAPIError(`${config.error}: ${config.message}`)
		if (!config || !config.guildId) return null
		return config
	}

	async fetchOwnGuildConfig({
		reqConfig = {},
	}: DefaultProps): Promise<GuildConfig | null> {
		if (
			!reqConfig?.apikey &&
			!this.apikey &&
			!reqConfig?.communityId &&
			!this.communityId
		)
			throw new NoAuthError()

		const authentication =
			reqConfig?.communityId || this.communityId
				? `Cookie ${reqConfig?.communityId || this.communityId}` // auth method is cookie
				: `Token ${reqConfig?.apikey || this.apikey}` // auth method is api key
		const config = await fetch(`${this.apiurl}/communities/guildconfig`, {
			credentials: "include",
			headers: {
				authorization: authentication,
			},
		}).then((u) => u.json())

		if (config.error)
			throw new GenericAPIError(`${config.error}: ${config.message}`)

		return config
	}

	async setGuildConfig({
		config,
		reqConfig = {},
	}: {
		config: SetGuildConfig
	} & DefaultProps): Promise<GuildConfig> {
		if (
			!reqConfig?.apikey &&
			!this.apikey &&
			!reqConfig?.communityId &&
			!this.communityId
		)
			throw new NoAuthError()
		const authentication =
			reqConfig?.communityId || this.communityId
				? `Cookie ${reqConfig?.communityId || this.communityId}` // auth method is cookie
				: `Token ${reqConfig?.apikey || this.apikey}` // auth method is api key
		const update = await fetch(`${this.apiurl}/communities/guildconfig`, {
			method: "POST",
			body: JSON.stringify(config),
			credentials: "include",
			headers: {
				authorization: authentication,
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (update.error)
			throw new GenericAPIError(`${update.error}: ${update.message}`)
		return update
	}
	async fetchCommunityConfig({
		communityId,
		cache = true,
		force = false,
	}: {
		communityId: ApiID
		cache?: boolean
		force?: boolean
	}): Promise<Community | null> {
		return this.fetchCommunity({ communityId, cache, force })
	}

	async setCommunityConfig({
		config,
		reqConfig = {},
	}: { config: SetCommunityConfig } & DefaultProps): Promise<Community> {
		if (
			!reqConfig?.apikey &&
			!this.apikey &&
			!reqConfig?.communityId &&
			!this.communityId
		)
			throw new NoAuthError()
		const authentication =
			reqConfig?.communityId || this.communityId
				? `Cookie ${reqConfig?.communityId || this.communityId}` // auth method is cookie
				: `Token ${reqConfig?.apikey || this.apikey}` // auth method is api key
		const update = await fetch(
			`${this.apiurl}/communities/communityconfig`,
			{
				method: "POST",
				body: JSON.stringify(config),
				credentials: "include",
				headers: {
					authorization: authentication,
					"content-type": "application/json",
				},
			}
		).then((u) => u.json())
		if (update.error)
			throw new GenericAPIError(`${update.error}: ${update.message}`)
		return update
	}

	async notifyGuildConfig({
		guildId,
		reqConfig = {},
	}: {
		guildId: string
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
		const create = await fetch(
			`${
				this.apiurl
			}/communities/notifyGuildConfigChanged/${strictUriEncode(guildId)}`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					authorization: authentication,
				},
			}
		).then((u) => u.json())
		if (create.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
	}

	async guildLeave({
		guildId,
		reqConfig = {},
	}: {
		guildId: string
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
		const create = await fetch(
			`${this.apiurl}/communities/guildLeave/${strictUriEncode(guildId)}`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					authorization: authentication,
				},
			}
		).then((u) => u.json())
		if (create.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
	}

	async create({
		name,
		contact,
		guildId,
		reqConfig = {},
	}: {
		name: string
		contact: string
		guildId: string
	} & DefaultProps): Promise<{
		community: Community
		apiKey: string
	}> {
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

		const create = await fetch(`${this.apiurl}/communities`, {
			method: "POST",
			body: JSON.stringify({
				name: name,
				contact: contact,
				guildId: guildId,
			}),
			credentials: "include",
			headers: {
				authorization: authentication,
				"content-type": "application/json",
			},
		}).then((u) => u.json())
		if (create.error)
			throw new GenericAPIError(`${create.error}: ${create.message}`)
		return create
	}

	async remove({
		communityId,
		reqConfig = {},
	}: {
		communityId: string
	} & DefaultProps): Promise<boolean> {
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
		const remove = await fetch(
			`${this.apiurl}/communities/${strictUriEncode(communityId)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: authentication,
				},
			}
		).then((u) => u.json())
		if (remove.error)
			throw new GenericAPIError(`${remove.error}: ${remove.message}`)
		return remove
	}
}
