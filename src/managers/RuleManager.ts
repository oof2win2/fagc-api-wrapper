import fetch from "isomorphic-fetch"
import {
	GenericAPIError,
	NoMasterApikeyError,
	NoAuthError,
	DefaultProps,
	ManagerOptions,
	WrapperOptions,
} from "../types"
import { Rule, ApiID } from "fagc-api-types"
import BaseManager from "./BaseManager"
import strictUriEncode from "strict-uri-encode"

export class RuleManager extends BaseManager<Rule> {
	private apiurl: string
	constructor(options: WrapperOptions, managerOptions: ManagerOptions = {}) {
		super(managerOptions)
		this.apiurl = options.apiurl
		if (options.apikey) this.apikey = options.apikey
		if (options.masterapikey) this.masterapikey = options.masterapikey
	}
	async fetchRule({
		ruleid,
		cache = true,
		force = false,
	}: {
		ruleid: ApiID
		cache?: boolean
		force?: boolean
	}): Promise<Rule | null> {
		if (!force) {
			const cached =
				this.cache.get(ruleid) || this.fetchingCache.get(ruleid)
			if (cached) return cached
		}
		let promiseResolve: (value: unknown) => void
		const fetchingPromise: Promise<Rule | null> = new Promise((resolve) => {
			promiseResolve = resolve
		})

		this.fetchingCache.set(ruleid, fetchingPromise)

		const fetched = await fetch(
			`${this.apiurl}/rules/${strictUriEncode(ruleid)}`,
			{
				credentials: "include",
			}
		).then((r) => r.json())

		if (!fetched || !fetched.id) return null // return null if the fetch is empty

		if (cache) this.add(fetched)
		promiseResolve(fetched)
		setTimeout(() => {
			this.fetchingCache.sweep((data) => typeof data.then === "function")
		}, 0)
		if (fetched.id === ruleid) return fetched
		return null
	}
	async fetchAll({ cache = true }: { cache?: boolean }): Promise<Rule[]> {
		const allRules = await fetch(`${this.apiurl}/rules`, {
			credentials: "include",
		}).then((r) => r.json())

		if (cache && allRules[0])
			return allRules.map((rule: Rule) => this.add(rule))

		return allRules
	}
	resolveID(ruleid: string): Rule | null {
		const cached = this.cache.get(ruleid)
		if (cached) return cached
		return null
	}

	async create({
		rule,
		reqConfig,
	}: {
		rule: Omit<Rule, "id">
	} & DefaultProps): Promise<Rule> {
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
		const data = await fetch(`${this.apiurl}/rules`, {
			method: "POST",
			body: JSON.stringify(rule),
			credentials: "include",
			headers: {
				authorization: authentication,
				"content-type": "application/json",
			},
		}).then((r) => r.json())

		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)

		this.add(data)

		return data
	}

	async remove({
		id,
		reqConfig,
	}: {
		id: string
	} & DefaultProps): Promise<Rule | null> {
		if (!this.masterapikey && !reqConfig.masterapikey)
			throw new NoMasterApikeyError()
		const data = await fetch(
			`${this.apiurl}/rules/${strictUriEncode(id)}`,
			{
				method: "DELETE",
				credentials: "include",
				headers: {
					authorization: `Token ${
						reqConfig.masterapikey || this.masterapikey
					}`,
					"content-type": "application/json",
				},
			}
		).then((r) => r.json())

		if (data.error)
			throw new GenericAPIError(`${data.error}: ${data.message}`)
		if (!data.id) throw data
		this.removeFromCache(data)

		return data
	}
}
