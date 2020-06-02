// 公式を自分でアレンジ
//　https://jp.vuejs.org/v2/examples/todomvc.html

import Vue from 'vue'

// イベントバス(子コンポーネント間で値の受け渡し)のためのインスタンス
const bus = new Vue();
const bus2 = new Vue();
const bus3 = new Vue();
const bus4 = new Vue();
// 追加欄用子コンポーネント
// コンポーネントで使う場合のdataは必ず関数にすること！
Vue.component('add-todo', {
    data: function () {
        return {
            newTodo: '', // 追加するTODO内容
            uid: 0,
            errMsg: '', // 空欄時のエラ〜メッセージ ============================ 追加事項
            canAddTodo: false, // 追加欄の変換時エンターキー制御 ============================ 追加事項
            todos: [], // Todoの一覧の配列 ============================ 追加事項
            catchedSearchText: '', // 検索欄に入力された文字をふるいに掛けるため。
        }
    },
    /* template内から直接Vueインスタンス内にアクセスすることができないので、
    一旦template内とHTML内のタグを$emitで連携させる。 */
    // props: ['newtodo','errmsg','canaddtodo','todos'],
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
        bus2.$on('bus-second-event', this.catchSearchText );
        bus4.$on('bus-remove-event', this.catchRemovedTodo);
    },
    computed: {
        filteredTodos: function () {
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
        addTodo: function () { // TODO追加メソッド
            if(!this.canAddTodo) {
                this.canAddTodo = '';
                return;
            }
            const value = this.newTodo && this.newTodo.trim(); // trim()で文字列両端の空白を削除する。
            if (!value) { // 空白の場合
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
new Vue({ // 子コンポーネントを生み出すための親インスタンスを生成する
    el:'#add-todo',
});
//検索欄用コンポーネント
Vue.component('search-todo',{
    data: function () {
        return {
            searchText: '', // 検索ワード ============================ 追加事項
            // firstTodos: [], TODO
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
        throwSearchText: function () {
            bus2.$emit('bus-second-event', this.searchText);
        },
    },
})
new Vue({
    el: '#search-todo',
})
// TODO一覧コンポーネント
Vue.component('todo-list', {
    data: function () {
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
                    :class="{ completed: todo.completed, editing: todo == editedTodo }"><!-- todo==editedの時に
                        editingというクラス名が付与されるようになっている(labelがクリックされた時にeditTodoが発動して
                        editedTodoにtodoが代入されるようになっているので必然的にそうなる)。-->
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
        removeTodo: function (todo) {
            // 追加にせよ検索にせよ受け取ったTODO群から指定のTODOを削除して、追加欄コンポーネント(大元)に返す。
            this.filteredTodos.splice(this.filteredTodos.indexOf(todo), 1)
            bus4.$emit('bus-remove-event', this.filteredTodos);
        },
        // 編集モードに入る
        editTodo: function (todo) {
            this.beforeEditCache = todo.title // エスケープキーで戻した時のために編集前のタスクを格納しておく。
            this.editedTodo = todo // editedTodoに当TODOを格納する
        },
        // 編集モード完了
        doneEdit: function (todo) {
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
        cancelEdit: function (todo) {
            this.editedTodo = null
            todo.title = this.beforeEditCache // TODO内容を元に戻す
        },
        // addTodoメソッドで渡ってきたTODO群をこのコンポーネント内で編集できるように格納する。
        catchFirstTodos: function (firstTodos) {
            this.filteredTodos = firstTodos;
        },
        // 検索でフィルターに掛けられたTODO群をこのコンポーネント内で編集できるように格納する。
        catchTodos: function (filteredTodos) {
            this.filteredTodos = filteredTodos;
        },
    },
    directives: { // 編集モードに入った時に、タスク内容に自動でフォーカスされる
        'todo-focus': function (el, binding) {
            if (binding.value) {
                el.focus()
            }
        }
    }
})
new Vue({
    el: '#todo-list',
})
