<template>
    <v-sheet>
        <!---Topbar Row-->
        <div class="d-flex gap-2 align-center pa-6">
            <!---User Avatar-->
            <v-avatar size="large">
                <img :src="getProfile(picture)" alt="pro" width="54" />
            </v-avatar>

            <v-badge class="badg-dotDetail" dot color="success"> </v-badge>
            <!---Name & Last seen-->
            <div>
                <h5 class="text-subtitle-1 font-weight-semibold">{{ name }}</h5>
                <span class="text-subtitle-2 font-weight-medium text-grey100">Admin</span>
            </div>
        </div>
    </v-sheet>
</template>

<script>
export default {
    name: 'ChatProfile',
    data() {
        return {
            name: localStorage.getItem("userName"),
            email: localStorage.getItem("email"),
            picture: localStorage.getItem("picture")
        };
    },
    methods: {
        getProfile(profile) {
            let basePath = window.location.port == '' ? window.location.origin:'' 
            if(profile){
                if(profile.includes("defaultUser.png")){
                    return `${basePath}/images/defaultUser.png`;
                } else {
                    const img = new Image();
                    img.src = profile;
                    img.onerror = () => {
                        return `${basePath}/images/defaultUser.png`;
                    };
                    return profile;
                }
            } else {
                return `${basePath}/images/defaultUser.png`;
            }
        }
    }
};
</script>

