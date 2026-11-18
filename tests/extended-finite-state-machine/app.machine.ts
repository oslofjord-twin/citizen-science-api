import { setup, assign, assertEvent, fromPromise } from "xstate";
import { AppEvents } from "./app.events";
import { CreateTemperatureMeasurementData } from "../../src/services/temperatureService";
import { isWithinOslofjord } from "../../src/utils/geoUtil";
import { errorMessage, services } from "./app.services";
import {
	Session,
	AppContext,
	LoginCredentials,
	SignupCredentials,
	ChangePasswordInput,
	DeleteAccountInput,
	MeasurementResult,
	MeasurementInput,
	AvatarResult,
	AvatarInput,
	DeleteMeasurementResult,
	DeleteMeasurementInput,
} from "./app.types";

const isValidMeasurement = (data: Partial<CreateTemperatureMeasurementData>): boolean => {
	const { userId, value_celsius, depth_meters, instrument_type, latitude, longitude, measurement_date, notes } =
		data;
	return (
		value_celsius !== null &&
		latitude !== null &&
		longitude !== null &&
		!!measurement_date &&
		typeof value_celsius === "number" &&
		typeof latitude === "number" &&
		typeof longitude === "number" &&
		-90 <= latitude &&
		latitude <= 90 &&
		-180 <= longitude &&
		longitude <= 180 &&
		isWithinOslofjord(latitude, longitude) &&
		(depth_meters === undefined || typeof depth_meters === "number")
	);
};

export const appMachine = setup({
	types: {
		context: {} as AppContext,
		events: {} as AppEvents,
	},
	actors: {
		logIn: fromPromise<Session, LoginCredentials>(({ input }) => services.logIn(input)),
		signUp: fromPromise<Session, SignupCredentials>(({ input }) => services.signUp(input)),
		signOut: fromPromise<void, { cookie: string }>(({ input }) => services.signOut(input.cookie)),
		changePassword: fromPromise<void, { passwords: ChangePasswordInput; cookie: string }>(({ input }) =>
			services.changePassword(input.passwords, input.cookie),
		),
		deleteAccount: fromPromise<void, DeleteAccountInput & { cookie: string }>(({ input }) =>
			services.deleteAccount(input.password, input.cookie),
		),
		sendSubmission: fromPromise<MeasurementResult, { data: MeasurementInput; cookie: string }>(
			({ input }) => {
				return services.submitMeasurement(input.data, input.cookie);
			},
		),
		changeAvatar: fromPromise<AvatarResult, AvatarInput & { cookie: string }>(({ input }) =>
			services.changeAvatar(input.avatarId, input.cookie),
		),
		deleteMeasurement: fromPromise<DeleteMeasurementResult, DeleteMeasurementInput & { cookie: string }>(
			({ input }) => services.deleteMeasurement(input.measurementId, input.cookie),
		),
	},
	guards: {
		isValidSubmission: ({ event }) => event.type === "submit.send" && isValidMeasurement(event.data),
	},
	actions: {
		clearError: assign({ error: null }),
		clearSession: assign({ user: null, error: null, cookie: null }),
	},
}).createMachine({
	id: "app",
	initial: "unauthorized",
	context: { user: null, error: null, cookie: null },
	states: {
		unauthorized: {
			initial: "logIn",
			states: {
				logIn: {
					on: {
						"auth.logIn": { target: "loggingIn", actions: "clearError" },
						"auth.goToSignUp": { target: "signUp", actions: "clearError" },
					},
				},
				loggingIn: {
					invoke: {
						src: "logIn",
						input: ({ event }) => {
							assertEvent(event, "auth.logIn");
							return {
								email: event.email,
								password: event.password,
							};
						},
						onDone: {
							target: "#app.authorized",
							actions: assign(({ event }) => ({
								...event.output,
								error: null,
							})),
						},
						onError: {
							target: "logIn",
							actions: assign({
								error: ({ event }) => errorMessage(event.error),
							}),
						},
					},
				},
				signUp: {
					on: {
						"auth.signUp": { target: "signingUp", actions: "clearError" },
						"auth.goToLogIn": { target: "logIn", actions: "clearError" },
					},
				},
				signingUp: {
					invoke: {
						src: "signUp",
						input: ({ event }) => {
							assertEvent(event, "auth.signUp");
							return {
								name: event.name,
								email: event.email,
								password: event.password,
							};
						},
						onDone: {
							target: "#app.authorized",
							actions: assign(({ event }) => ({
								...event.output,
								error: null,
							})),
						},
						onError: {
							target: "signUp",
							actions: assign({
								error: ({ event }) => errorMessage(event.error),
							}),
						},
					},
				},
			},
		},

		authorized: {
			initial: "home",
			on: {
				"tab.home": { target: ".home", actions: "clearError" },
				"tab.submitData": { target: ".submitData", actions: "clearError" },
				"tab.profile": { target: ".profile", actions: "clearError" },
			},
			states: {
				home: {
					initial: "overview",
					states: {
						overview: {
							on: {
								"home.openLeaderboard": "leaderboard",
								"home.openCommunityGoal": "communityGoal",
								"home.openSubmitData": "#submitData",
							},
						},
						leaderboard: {
							on: {
								back: { target: "overview", actions: "clearError" },
							},
						},
						communityGoal: {
							on: {
								back: { target: "overview", actions: "clearError" },
							},
						},
					},
				},
				submitData: {
					id: "submitData",
					initial: "form",
					states: {
						form: {
							on: {
								"submit.send": [
									{
										guard: "isValidSubmission",
										target: "submitting",
										actions: "clearError",
									},
									{
										actions: assign({
											error: "Invalid measurement",
										}),
									},
								],
							},
						},
						submitting: {
							invoke: {
								src: "sendSubmission",
								input: ({ context, event }) => {
									assertEvent(event, "submit.send");
									return {
										data: event.data,
										cookie: context.cookie!,
									};
								},
								onDone: {
									target: "reward",
									actions: assign({
										user: ({ event }) => event.output.user,
									}),
								},
								onError: {
									target: "form",
									actions: assign({
										error: ({ event }) =>
											errorMessage(event.error),
									}),
								},
							},
						},
						reward: {
							on: {
								back: { target: "form", actions: "clearError" },
							},
						},
					},
				},
				profile: {
					initial: "overview",
					states: {
						overview: {
							on: {
								"profile.openAchievements": "achievements",
								"profile.openMeasurements": "measurements",
								"profile.openAvatars": "avatars",
								"profile.openChangePassword": "changePassword",
								"profile.openDeleteAccount": "deleteAccount",
								"profile.signOut": "signOut",
							},
						},
						achievements: {
							on: {
								back: { target: "overview", actions: "clearError" },
							},
						},
						measurements: {
							on: {
								back: { target: "overview", actions: "clearError" },
								"profile.deleteMeasurement": "deletingMeasurement",
							},
						},
						deletingMeasurement: {
							invoke: {
								src: "deleteMeasurement",
								input: ({ context, event }) => {
									assertEvent(event, "profile.deleteMeasurement");
									return {
										measurementId: event.measurementId,
										cookie: context.cookie!,
									};
								},
								onDone: {
									target: "measurements",
									actions: assign({
										user: ({ event }) => event.output.user,
									}),
								},
								onError: {
									target: "measurements",
									actions: assign({
										error: ({ event }) =>
											errorMessage(event.error),
									}),
								},
							},
						},
						avatars: {
							on: {
								back: { target: "overview", actions: "clearError" },
								"profile.changeAvatar": "changingAvatar",
							},
						},
						changingAvatar: {
							invoke: {
								src: "changeAvatar",
								input: ({ context, event }) => {
									assertEvent(event, "profile.changeAvatar");
									return {
										avatarId: event.avatarId,
										cookie: context.cookie!,
									};
								},
								onDone: {
									target: "avatars",
									actions: assign({
										user: ({ event }) => event.output.user,
									}),
								},
								onError: {
									target: "avatars",
									actions: assign({
										error: ({ event }) =>
											errorMessage(event.error),
									}),
								},
							},
						},
						changePassword: {
							on: {
								cancel: "overview",
								"profile.changePassword": "changingPassword",
							},
						},
						changingPassword: {
							invoke: {
								src: "changePassword",
								input: ({ context, event }) => {
									assertEvent(event, "profile.changePassword");
									return {
										passwords: {
											currentPassword:
												event.currentPassword,
											newPassword: event.newPassword,
										},
										cookie: context.cookie!,
									};
								},
								onDone: {
									target: "overview",
									actions: "clearError",
								},
								onError: {
									target: "changePassword",
									actions: assign({
										error: ({ event }) =>
											errorMessage(event.error),
									}),
								},
							},
						},
						deleteAccount: {
							on: {
								cancel: "overview",
								"profile.confirmDeleteAccount": "deletingAccount",
							},
						},
						deletingAccount: {
							invoke: {
								src: "deleteAccount",
								input: ({ context, event }) => {
									assertEvent(
										event,
										"profile.confirmDeleteAccount",
									);
									return {
										password: event.password,
										cookie: context.cookie!,
									};
								},
								onDone: {
									target: "#app.unauthorized",
									actions: "clearSession",
								},
								onError: {
									target: "deleteAccount",
									actions: assign({
										error: ({ event }) =>
											errorMessage(event.error),
									}),
								},
							},
						},
						signOut: {
							on: {
								cancel: "overview",
								"profile.confirmSignOut": "signingOut",
							},
						},
						signingOut: {
							invoke: {
								src: "signOut",
								input: ({ context, event }) => {
									assertEvent(event, "profile.confirmSignOut");
									return {
										cookie: context.cookie!,
									};
								},
								onDone: {
									target: "#app.unauthorized",
									actions: "clearSession",
								},
								onError: {
									target: "#app.unauthorized",
									actions: "clearSession",
								},
							},
						},
					},
				},
			},
		},
	},
});
