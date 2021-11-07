import { ApiID, Rule } from "fagc-api-types"
import { NoAuthError, RequestConfig } from "."
import BaseManager from "./managers/BaseManager"

export interface DefaultProps {
	reqConfig?: RequestConfig
	authentication?: string
}

export const Authenticate = <T extends DefaultProps = DefaultProps>() => {
	return function (
		target: unknown & BaseManager<{ id: string }>,
		_key: string,
		descriptor: TypedPropertyDescriptor<(args: T) => any>
	): void {
		const original = descriptor.value
		descriptor.value = function (args: T) {
			if (
				!args.reqConfig.apikey &&
				!target.apikey &&
				!args.reqConfig.communityId &&
				!this.communityId
			)
				throw new NoAuthError()

			const usingCookie = args.reqConfig.communityId || this.communityId
			args.authentication = usingCookie
				? `Cookie ${args.reqConfig.communityId || this.communityId}`
				: `Token ${args.reqConfig.apikey || this.apikey}`

			return original.apply(this, [args])
		}
	}
}
export const MasterAuthenticate = <T extends DefaultProps = DefaultProps>() => {
	return function (
		target: unknown & BaseManager<{ id: string }>,
		_key: string,
		descriptor: TypedPropertyDescriptor<(args: T) => any>
	): void {
		const original = descriptor.value
		descriptor.value = function (args: T) {
			if (
				!args.reqConfig.masterapikey &&
				!target.masterapikey &&
				!args.reqConfig.communityId &&
				!target.communityId
			)
				throw new NoAuthError()

			const usingCookie = args.reqConfig.communityId || this.communityId
			args.authentication = usingCookie
				? `Cookie ${args.reqConfig.communityId || this.communityId}`
				: `Token ${args.reqConfig.masterapikey || this.masterapikey}`

			return original.apply(this, [args])
		}
	}
}
