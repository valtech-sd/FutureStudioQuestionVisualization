<template>
  <div class="container" v-if="!done">
    <div class="row">
      <div class="col-sm">
        <div class="alert alert-danger" role="alert" v-if="error">
          {{ error }}
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-sm">
        <form v-on:submit.prevent>
          <div class="form-group">
            <label for="future"
              >What comes to mind when you think about sustainability in the
              context of our business practices?</label
            >
            <textarea
              class="form-control"
              name="entry[body]"
              id="future"
              rows="3"
              v-model="answer"
            ></textarea>
          </div>
          <input type="submit" class="btn btn-primary" v-on:click="submit" />
        </form>
      </div>
    </div>
  </div>
  <div class="container" v-if="done">
    <div class="row">
      <div class="col-sm">
        Thank you for answering the question!
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Question',
  data() {
    return {
      answer: '',
      error: '',
      done: false,
    };
  },
  methods: {
    async submit() {
      const answer = this.answer;
      this.answer = '';
      try {
        let url = process.env.VUE_APP_ANSWER_HOST;
        console.log(url);
        await axios.post(url, {
          entry: { body: answer },
          addedContexts: 'FutureStudio',
        });
        this.done = true;
        this.error = '';
      } catch (e) {
        if (e.response && e.response.body && e.response.body.message) {
          this.error = e.response.body.message;
        } else {
          this.error = 'Error ocurred while submitting answer!';
        }
        this.answer = answer;
      }
    },
  },
};
</script>

<style scoped>
.container {
  margin-top: 100px;
}
</style>
