var demo = new Vue({
  el: '#app',
  data: function () {
    return {
      textRender: 'false',
      test: 123,
      ttthlll: 'qqqqq',
      list: [{ id: 1, name: '1111' }]
    }
  },
  created() {
    console.log(this.test, '????????');
  },
  //   template: `
  //   <input
  //     type="text"
  //     v-bind:value="test"
  //     v-on:input="$emit('input', $event.target.value)"
  //   >
  // `
  template: `
  <div v-model="test" :mode="textRender">
    <div v-for="item in list">{{item.name}}</div>
    <input
      type="text"
      v-bind:value="test"
      v-on:input="$emit('input', $event.target.value)"
    >
  </div>
`
})