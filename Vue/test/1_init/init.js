var demo = new Vue({
    el: '#app',
    data: function () {
        return {
            textRender: 'false',
            test: 123,
            ttthlll: 'qqqqq'
        }
    },
    created() {
        console.log(this.test,'????????');
    }
})