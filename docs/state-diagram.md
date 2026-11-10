```mermaid
---
config:
    layout: elk
---
stateDiagram-v2
    signUp: Sign Up
    logIn : Log In
    home : Home
    leaderboard : Leaderboard
    communityGoal : Community Goal
    submitData : Submit Data
    profile : Profile
    mySubmissions : My Submissions
    achievements : Achievements
    avatars : Avatars
    changePassword : Change Password
    reward: Reward
    deleteAccount : Delete Account
    selectLocation: Select Location



    [*] --> logIn
    logIn --> signUp : Sign Up
    logIn --> home : Log In
    home --> leaderboard
    home --> communityGoal
    home --> submitData
    home --> profile
    leaderboard --> home : Back
    communityGoal --> home : Back
    submitData --> home
    submitData --> selectLocation : Select Location
    submitData --> reward : Submit
    selectLocation --> submitData : Back
    selectLocation --> submitData : Confirm
    reward --> submitData
    profile --> home
    profile --> mySubmissions
    profile --> achievements
    profile --> avatars
    profile --> changePassword
    profile --> logIn : Sign Out
    profile --> deleteAccount : Delete Account
    deleteAccount --> profile : Cancel
    deleteAccount --> logIn : Delete Account Permenently
    mySubmissions --> profile
    achievements --> profile
    avatars --> profile
    changePassword --> profile : Change Password
    changePassword --> profile : Cancel

    classDef auth       fill:#BBDEFB,stroke:#1565C0,color:#0D47A1,stroke-width:2px
    classDef hub        fill:#FFE082,stroke:#F57F17,color:#5D4037,stroke-width:3px
    classDef community  fill:#C8E6C9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef data       fill:#B2EBF2,stroke:#00838F,color:#004D40,stroke-width:2px
    classDef profile    fill:#E1BEE7,stroke:#6A1B9A,color:#4A148C,stroke-width:2px
    classDef danger     fill:#FFCDD2,stroke:#C62828,color:#B71C1C,stroke-width:2px

    class logIn, signUp auth
    class home hub
    class leaderboard, communityGoal community
    class submitData, selectLocation, reward data
    class profile, mySubmissions, achievements, avatars, changePassword profile
    class deleteAccount danger

```