<template>
  <div id="app">
    <h1>TODOS</h1>
    <header class="header">
      <div id="add-todo">
        <!-- 追加欄用コンポーネント生成 -->
        <add-todo></add-todo>
      </div>
      <div id="search-todo">
        <!-- 検索欄用コンポーネント生成 -->
        <search-todo>
        </search-todo>
      </div>
    </header>
    <div class="todoapp">
      <section class="main" v-cloak>
        <ul class="todo-list" id="list-demo">
          <div id="todo-list">
            <todo-list>
            </todo-list>
          </div>
        </ul>
      </section>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'App',
}

// イベントバス(子コンポーネント間で値の受け渡し)のためのインスタンス
const bus = new Vue();
const bus2 = new Vue();
const bus3 = new Vue();
const bus4 = new Vue();

const AddTodo = Vue.extend({
  name: 'add-todo',
  data: function() {
    return {
      newTodo: '',// 追加するTODO内容
      uid: 0,
      errMsg: '',// 空欄時のエラ〜メッセージ
      canAddTodo: false,// 追加欄の変換時エンターキー制御
      todos: [],// Todoの一覧の配列
      catchedSearchText: '',// 検索欄に入力された文字をふるいに掛けるため。
    }
  },
  template: `
        <div>
            <p class="errMsg">{{ errMsg }}</p>
            <div class="addBox">
                <i class="fas fa-plus"></i>
                <input class="new-todo"
                       v-model="newTodo"
                       v-on:keyup.enter="addTodo()"
                       v-on:keypress="setCanAddTodo()"
                       placeholder="add new todo"
                       autofocus autocomplete="off">
            </div>
        </div>
    `,
  mounted:function() {
    bus2.$on('bus-second-event', this.catchSearchText);
    bus4.$on('bus-remove-event', this.catchRemovedTodo);
  },
  computed: {
    filteredTodos: function() {
      let todos = [];
      const regexp = new RegExp('^' + this.catchedSearchText, 'i');
      for(let i in this.todos){
        let todo = this.todos[i];
        if(todo.title.match(regexp) ){
          todos.push(todo);
        }
      }
      return todos;
    },
  },
  methods: {
    addTodo: function() { // TODO追加メソッド
      if(!this.canAddTodo) {
        this.canAddTodo = '';
        return;
      }
      const value = this.newTodo && this.newTodo.trim(); // trim()で文字列両端の空白を削除する。
      if(!value) { // 空白の場合
        this.canAddTodo = '';
        this.errMsg = '未入力です'; // errMsgにエラー内容を格納する
        return; // 追加処理せずに返す
      }
      this.todos.push({ // 新しいTODOをtodos[]配列にpushで追加
        id: this.uid++, // dataのuidをインクリメント
        title: value, // title=TODOの内容
        completed: false // チェック済みか
      })
      this.errMsg = ''; // エラーメッセージを空にする
      this.newTodo = ''; // 新規TODOの内容をリセットする
      this.canAddTodo = '';
      console.log('TODO追加：'+this.todos);
      bus.$emit('bus-first-event', this.todos);
    },
    // 日本語変換の時のエンターを制御
    setCanAddTodo() {
      this.canAddTodo = true;
    },
    // 検索欄に入力された文字を取得。そして検索に掛けた後のTODO群を一覧表示コンポーネントに渡す。
    catchSearchText(searchText) {
      this.catchedSearchText = searchText;
      bus3.$emit('bus-third-event', this.filteredTodos);
    },
    // 削除処理後のTODO群を取得
    catchRemovedTodo(removedTodo) {
      this.todos = removedTodo;
    }
  }
})
Vue.component('add-todo', AddTodo)

const SearchTodo = Vue.extend({
  name: 'search-todo',
  data: function() {
    return {
      searchText: '', // 検索ワード
    }
  },
  template: `
        <div class="searchBox">
            <i class="fa fa-search searchBox__icon"></i>
            <input v-on:keyup="throwSearchText" v-model="searchText" type="text" class="searchBox__input" placeholder="search todo">
        </div>
    `,
  methods: { // computedはドキュメントにも書いてありますが、高速化 and 省力化のためですね。
    // 検索欄に入力された文字をfilteredTodoで使うために、追加用コンポーネントに渡す。
    throwSearchText: function() {
      bus2.$emit('bus-second-event', this.searchText);
    },
  },
})
Vue.component('search-todo', SearchTodo)

const TodoList = Vue.extend({
  name: 'todo-list',
  data: function() {
    return {
      editedTodo: null, // labelクリックでeditedTodoがTODOになり、li要素に:classでeditingのクラス名が付与される。
      filteredTodos: [],
    }
  },
  template: `
        <div>
            <transition-group name="list" tag="p">
                <li v-for="todo in this.filteredTodos"
                    class="todo"
                    :key="todo.id"
                    :class="{ completed: todo.completed, editing: todo == editedTodo }">
                  <div class="view">
                    <input class="toggle" type="checkbox" v-model="todo.completed">
                    <i v-show="!todo.completed" class="far fa-square"></i>
                    <i v-show="todo.completed" class="far fa-check-square"></i>
                    <label @click="editTodo(todo)" class="edit-input">{{ todo.title }}</label>
                    <i class="fa fa-trash icon-trash destroy" @click="removeTodo(todo)"></i>
                  </div>
                  <div class="editBox">
                    <i class="fas fa-pen-fancy"></i>
                    <input class="edit" type="text"
                            v-model="todo.title"
                            v-todo-focus="todo == editedTodo"
                            @blur="doneEdit(todo)"
                            @keyup.enter="doneEdit(todo)"
                            @keyup.esc="cancelEdit(todo)">
                  </div>
                </li>
              </transition-group>
            </div>
  `,
    mounted: function() {
        bus.$on('bus-first-event', this.catchFirstTodos);
        bus3.$on('bus-third-event', this.catchTodos);
    },
    methods: {
        // TODO削除メソッド
        removeTodo: function(todo) {
            // 追加にせよ検索にせよ受け取ったTODO群から指定のTODOを削除して、追加欄コンポーネント(大元)に返す。
            this.filteredTodos.splice(this.filteredTodos.indexOf(todo), 1)
            bus4.$emit('bus-remove-event', this.filteredTodos);
        },
        // 編集モードに入る
        editTodo: function(todo) {
            this.beforeEditCache = todo.title // エスケープキーで戻した時のために編集前のタスクを格納しておく。
            this.editedTodo = todo // editedTodoに当TODOを格納する
        },
        // 編集モード完了
        doneEdit: function(todo) {
            if (!this.editedTodo) {
                return
            }
            this.editedTodo = null
            todo.title = todo.title.trim()
            if (!todo.title) { // 編集終了時空欄ならタスク自体を削除する
                this.removeTodo(todo)
            }
        },
        // エスケープキーで編集モード終了
        cancelEdit: function(todo) {
            this.editedTodo = null
            todo.title = this.beforeEditCache // TODO内容を元に戻す
        },
        // addTodoメソッドで渡ってきたTODO群をこのコンポーネント内で編集できるように格納する。
        catchFirstTodos: function(firstTodos) {
            this.filteredTodos = firstTodos;
        },
        // 検索でフィルターに掛けられたTODO群をこのコンポーネント内で編集できるように格納する。
        catchTodos: function(filteredTodos) {
            this.filteredTodos = filteredTodos;
        },
    },
    directives: { // 編集モードに入った時に、タスク内容に自動でフォーカスされる
        'todo-focus': function(el, binding) {
            if (binding.value) {
                el.focus()
            }
        }
    },
})
Vue.component('todo-list', TodoList)

</script>

<style>

html,
body,h1,p,div,section,h2,li,ul {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
button {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font-size: 100%;
  vertical-align: baseline;
  font-family: inherit;
  font-weight: inherit;
  color: inherit;
  -webkit-appearance: none;
  appearance: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  background: url("../img/paper_bg.png");
  background-size: cover;
  background-repeat: no-repeat;
  /*font-family: 'Kalam',  "Sawarabi Mincho", cursive;*/
  font-family: 'Kalam', "M PLUS Rounded 1c", cursive;
  /*font-family: 'Kalam', "Sawarabi Gothic", cursive;*/
  font-style: italic;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  min-width: 230px;
  max-width: 550px;
  margin: 0 auto;
  padding: 90px 0 40px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-weight: 300;
}
:focus {
  outline: 0;
}
.hidden {
  display: none;
}
/* タイトル */
h1 {
  font-size: 68px;
  font-style: normal;
  text-align: center;
  color: #333;
  -webkit-text-rendering: optimizeLegibility;
  -moz-text-rendering: optimizeLegibility;
  text-rendering: optimizeLegibility;
}

/* 追加欄のプレースホルダー */
.todoapp input::input-placeholder {
  font-style: italic;
  font-weight: 300;
  color: #8f8f8f;
}
/*追加欄と編集欄*/
.new-todo,
.searchBox__input {
  position: relative;
  margin: 0;
  width: 100%;
  font-size: 18px;
  font-family: inherit;
  font-weight: inherit;
  font-style: italic;
  line-height: 2em;
  border: 0;
  color: inherit;
  padding: 6px;
  border: 1px solid #999;
  box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
/* 追加欄 */
.addBox {
  box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
  width: 100%;
  margin-bottom: 25px;
  padding: 0 20px;
}
.new-todo {
  /*padding: 16px 16px 16px 60px;*/
  border: none;
  background: rgba(0, 0, 0, 0.003);
  box-shadow: none;
  width: calc(100% - 30px);
  /*box-shadow: inset 0 -2px 1px rgba(0,0,0,0.03);*/
}
.addBox .fas {
  font-size: 20px;
}
/*検索欄*/
.searchBox {
  box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
  border-radius: 30px;
  width: 100%;
  padding: 0 20px 0 19px;
  margin-bottom: 35px;
}
.searchBox__input {
  border: none;
  background: rgba(0, 0, 0, 0.003);
  box-shadow: none;
  width: calc(100% - 30px);
}
.searchBox .fa {
  font-size: 20px;
}
/*タスクのul*/
.todo-list {
  max-height: 450px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: scroll;
}
/*リスト要素*/
.todo-list li {
  position: relative;
  font-size: 18px;
  border-bottom: 1px solid #5f5f5f;
}
/*編集モード以外の時は非表示*/
.todo-list li .editBox{
  display: none;
}
.todo-list li.editing:last-child {
  margin-bottom: -1px;
}
/* 編集モードに入ったら元のタスクは非表示 */
.todo-list li.editing .view {
  display: none;
}
/* 編集モードの時のリスト要素 */
.todo-list li.editing {
  padding: 0;
}
/* 編集モードに入った時の編集欄 */
.todo-list li.editing .editBox {
  display: block;
  box-shadow: none;
  border-bottom: 1px solid #5f5f5f;
  width: 100%;
  padding: 10px 20px 10px 19px;
}
.todo-list li .edit {
  border: none;
  background: rgba(0, 0, 0, 0.003);
  box-shadow: none;
  font-size: 18px;
  font-family: inherit;
  font-weight: inherit;
  font-style: italic;
  line-height: 1.4em;
  width: calc(100% - 45px);
}
.todo-list li.editing .editBox .fas {
  font-size: 20px;
}
/* チェックボックス本体 */
.todo-list li .toggle {
  cursor: pointer;
  text-align: center;
  width: 40px;
  /* auto, since non-WebKit browsers doesn't support input styling */
  height: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto 0;
  border: none; /* Mobile Safari */
  -webkit-appearance: none;
  appearance: none;
}
/* 実際にチェックの付け外しを行う */
.todo-list li .toggle {
  opacity: 0;
  z-index: 1;
}
/* チェックアイコン 自作 */
.todo-list li .far {
  position: absolute;
  top: 15px;
  left: 19px;
}
/* タスクのラベル */
.todo-list li label {
  background-color: rgba(0, 0, 0, 0.003);;
  word-break: break-all;
  padding: 15px 35px 15px 50px;
  display: block;
  line-height: 1.2;
  transition: all 0.4s;
}
/* チェックが入った時に文字を薄くする */
.todo-list li.completed label {
  color: #8c8c8c;
  text-decoration: line-through;
}
/* チェックが入った時にアイコンを薄くする */
.todo-list li.completed .far {
  color: #8c8c8c;
}
/* ゴミ箱アイコン */
.todo-list li .destroy {
  font-size: 28px;
  color: #8c8c8c;
  cursor: pointer;
  line-height: 54px;
  position: absolute;
  top: 0;
  right: 10px;
}
/*ゴミ箱アイコンにホバー*/
.todo-list li .destroy:hover {
  color: #444;
  transition: all .4s;
}
.todo-list li .destroy:after {
  /*content: '×';*/
}
.todo-list li:hover .destroy {
  /*display: block;*/
}
</style>
