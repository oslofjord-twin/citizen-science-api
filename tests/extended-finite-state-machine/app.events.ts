import { CreateTemperatureMeasurementData } from "services/temperatureService";
import {
	AvatarInput,
	ChangePasswordInput,
	DeleteAccountInput,
	DeleteMeasurementInput,
	LoginCredentials,
	SignupCredentials,
} from "./app.types";

export type AppEvents =
	// auth
	| ({ type: "auth.logIn" } & LoginCredentials)
	| ({ type: "auth.signUp" } & SignupCredentials)
	| { type: "auth.goToSignUp" }
	| { type: "auth.goToLogIn" }
	| { type: "auth.signOut" }

	// bottom bar
	| { type: "tab.home" }
	| { type: "tab.submitData" }
	| { type: "tab.profile" }

	// home
	| { type: "home.openLeaderboard" }
	| { type: "home.openCommunityGoal" }
	| { type: "home.openSubmitData" }

	// submit data
	| ({ type: "submit.send" } & { data: CreateTemperatureMeasurementData })

	// profile
	| { type: "profile.openAchievements" }
	| { type: "profile.openMeasurements" }
	| ({ type: "profile.deleteMeasurement" } & DeleteMeasurementInput)
	| { type: "profile.openAvatars" }
	| ({ type: "profile.changeAvatar" } & AvatarInput)
	| { type: "profile.openChangePassword" }
	| ({ type: "profile.changePassword" } & ChangePasswordInput)
	| { type: "profile.openDeleteAccount" }
	| ({ type: "profile.confirmDeleteAccount" } & DeleteAccountInput)
	| { type: "profile.signOut" }
	| { type: "profile.confirmSignOut" }

	// generic
	| { type: "back" }
	| { type: "cancel" };

// for property-based
export const probabilityOf = () => {};

export type EventType = AppEvents["type"];
export type EventWeight = { type: EventType; weight: number };
export type EventNode = { on?: readonly EventWeight[]; states?: Record<string, EventNode> };

const bottomBar = [
	{ type: "tab.home", weight: 3 },
	{ type: "tab.submitData", weight: 3 },
	{ type: "tab.profile", weight: 2 },
] as const satisfies EventWeight[];

export const eventTree = {
	states: {
		unauthorized: {
			states: {
				logIn: {
					on: [
						{ type: "auth.logIn", weight: 3 },
						{ type: "auth.goToSignUp", weight: 1 },
					],
				},
				signUp: {
					on: [
						{ type: "auth.signUp", weight: 4 },
						{ type: "auth.goToLogIn", weight: 1 },
					],
				},
			},
		},
		authorized: {
			states: {
				home: {
					states: {
						overview: {
							on: [
								...bottomBar,
								{ type: "tab.home", weight: 1 },
								{ type: "home.openLeaderboard", weight: 4 },
								{ type: "home.openCommunityGoal", weight: 4 },
								{ type: "home.openSubmitData", weight: 1 },
							],
						},
						leaderboard: {
							on: [{ type: "back", weight: 1 }],
						},
						communityGoal: {
							on: [{ type: "back", weight: 1 }],
						},
					},
				},
				submitData: {
					states: {
						form: { on: [...bottomBar, { type: "submit.send", weight: 5 }] },
						reward: { on: [{ type: "back", weight: 1 }] },
					},
				},
				profile: {
					states: {
						overview: {
							on: [
								...bottomBar,
								{ type: "profile.openAchievements", weight: 6 },
								{ type: "profile.openMeasurements", weight: 6 },
								{ type: "profile.openAvatars", weight: 6 },
								{ type: "profile.openChangePassword", weight: 1 },
								{ type: "profile.openDeleteAccount", weight: 2 },
								{ type: "profile.signOut", weight: 1 },
							],
						},
						achievements: {
							on: [{ type: "back", weight: 1 }],
						},
						measurements: {
							on: [
								{ type: "back", weight: 3 },
								{ type: "profile.deleteMeasurement", weight: 1 },
							],
						},
						avatars: {
							on: [
								{ type: "back", weight: 1 },
								{ type: "profile.changeAvatar", weight: 3 },
							],
						},
						changePassword: {
							on: [
								{ type: "back", weight: 1 },
								{ type: "profile.changePassword", weight: 3 },
							],
						},
						deleteAccount: {
							on: [
								{ type: "cancel", weight: 3 },
								{ type: "profile.confirmDeleteAccount", weight: 1 },
							],
						},
						signOut: {
							on: [
								{ type: "cancel", weight: 1 },
								{ type: "profile.confirmSignOut", weight: 3 },
							],
						},
					},
				},
			},
		},
	},
} as const satisfies EventNode;
