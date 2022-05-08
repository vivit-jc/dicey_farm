
// ツールチップのセット
(function() {
  window.addEventListener("load", function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  });
})();

const app = {
  el: '#app',

  data() {
    return {
      viewStatus: "game",
      turn:1,
      status:"",
      rest:0,
      cost:0,
      penalty:0,
      activeItem:"",
      selectedItem:"",
      holdingDie:"",
      field_die:"",
      endGame:false,
      usedCommands:[],
      dice: [],
      workers: [],
      contracted:[],
      resCooking: "",
      fast_seeding_kind: "",
      aot:[2,2,3,3,3,4,4,4],
      resources: [
        {name:"勝利点",num:0},
        {name:"物乞い",num:0},
        {name:"食料",num:3},
        {name:"魚",num:0},
        {name:"麦",num:0},
        {name:"野菜",num:0},
        {name:"花",num:0},
        {name:"麦の種",num:0},
        {name:"野菜の種",num:0},
        {name:"花の種",num:0},
        {name:"鶏",num:0},
        {name:"羊",num:0},
        {name:"豚",num:0},
        {name:"牛",num:0},
        {name:"肉",num:0},
        {name:"卵",num:0},
        {name:"牛乳",num:0},
        {name:"バター",num:0},
        {name:"羊毛",num:0},
        {name:"ウィスキー",num:0},
        {name:"宝石",num:0},
        
      ],
      commands: [
        {name:"釣り",des:"魚を(N-2)個得る（最低1）"},
        {name:"畑を耕す1",des:"畑を1つ増やす"},
        {name:"畑を耕す2",des:"1と同じ目しか置けない"},
        {name:"種を蒔く",des:"N箇所の畑に種を蒔く"},
        {name:"商人",des:"リストの品物を買う 何回でも可"},
        {name:"契約",des:"食料Nを払って職人1人と契約する"},
        {name:"出荷",des:"商品を市場で売るか、職人に届ける(N+3回)"},
        {name:"増築",des:"設備を1つ建てる 6しか置けない"}
      ],
      workers_deck: [
        //変換方法が複数ある職人はchange:trueを付けないことに注意
        {name:"パン職人",des:"麦を2食料か1VPに変える",cost:1},
        {name:"菓子職人",des:"麦、卵、牛乳を6VPに変える",cost:1,change:true},
        {name:"ウィスキー職人",des:"麦2つをウィスキーに変える",cost:1,change:true},
        {name:"釣り人",des:"釣りで得る魚+3",cost:1},
        {name:"チーズ職人",des:"牛乳を2VPに変える",cost:1,change:true},
        {name:"精肉屋",des:"家畜を肉に変える 鶏:1 羊:2 豚:3 牛:4",cost:1},
        {name:"ハム職人",des:"豚を4VPに変える",cost:1,change:true},
        {name:"役人",des:"ダイス1つの目をひっくり返す",cost:1,dice:true},
        {name:"行商人",des:"商人とは別の買い物スロットを追加",cost:1},
        {name:"仕立て屋",des:"3羊毛を8VPに変える",cost:1,change:true},
        {name:"会計士",des:"ゲーム終了時、5VPにつき1VP得る",cost:1},
        {name:"牛飼い",des:"牛がいれば1回で2つの畑を耕せる",cost:1},
        {name:"世話人",des:"毎ラウンド開始時、食料2を得る",cost:1},
        {name:"種まき人",des:"商人から種を購入するたびに、そのうち１つを蒔いてよい",cost:1},
        {name:"牧師",des:"ゲーム終了時、物乞いを5回まで無視する",cost:1},
        {name:"ソーセージ職人",des:"肉を2食料か3VPに変える",cost:1},
        {name:"養蜂家",des:"麦、野菜、花の収穫時に得る種+1",cost:1},
        {name:"長老",des:"ダイス1つの目を+1か-1する",cost:1,dice:true},
        {name:"測量士",des:"ゲーム終了時、畑が10以上あれば12VP",cost:1},
        {name:"畜産学者",des:"ゲーム終了時、鶏、羊、豚、牛をすべて所有していれば10VP",cost:1},
        {name:"荷運び",des:"出荷の回数+3",cost:1},
        {name:"斡旋業者",des:"契約時の食料コストが常に1になる",cost:1},
        {name:"大工",des:"どのダイスでも増築できる",cost:1},
        {name:"花屋",des:"花を3VPと花の種1つに変える",cost:1,change:true},
      ],
      items: [
        {name:"麦の種",kind:"wheat_seed",num:2},
        {name:"野菜の種",kind:"vegetable_seed",num:2},
        {name:"花の種",kind:"flower_seed",num:2},
        {name:"鶏",kind:"chiken",num:1},
        {name:"豚",kind:"pig",num:1},
        {name:"羊",kind:"sheep",num:1},
      ],
      items2:[],
      facilities: [
        {name:"パン焼きかまど",des:"麦を2食料に変える(N回まで)",cost:0,action:true},
        {name:"バター工房",des:"牛乳をバターに変える(N回まで)",cost:0,action:true},
        {name:"燻製小屋",des:"肉、魚が腐らなくなる",cost:0},
        {name:"毛刈り小屋",des:"毎ラウンド終了時、羊2匹につき追加の羊毛1を得る",cost:0},
        {name:"解体小屋",des:"家畜1頭を肉に変える 鶏:1 羊:2 豚:3 牛:4",cost:0,action:true},
      ],
      fields: [],
      options: [
        { value: -1, label: 'すべて' },
        { value: 0, label: '作業中' },
        { value: 1, label: '完了' }
      ]
    }
  },

  computed: {
    dice_is_zero: function(){
      return this.dice.length === 0
    },
    empty_field: function(){
      return this.fields.find(e => e.kind === "空き")
    },
    turn_seq: function(){
      let str = ""
      for(let i=this.turn-1;i<8;i++){
        str += this.aot[i]
        if(i != 7){str += " > "}
      }
      return str
    },
    food_cost: function(){
      // 契約した職人の維持コストを実装するか迷う
//      let wc = 0
//      this.contracted.forEach(e => {
//        wc += e.cost
//      })
//      return this.aot[this.turn-1] + wc
      return this.aot[this.turn-1]+1
    },
  },

  watch: {

  },

  created() {
    this.shuffle(this.items)
    this.shuffle(this.workers_deck)

    for(let i=0;i<2;i++){
      this.dice.push({num:Math.floor(Math.random()*6)+1})
    }

    for(let i=0;i<3;i++){
      this.workers.push(this.workers_deck.pop())
    }

    this.fields.push({kind:"空き"})
    //this.fields.push({kind:"空き"})
  },

  methods: {
    
    click_die: function(die){
      if(this.status){return false}
      this.holdingDie = die
    },

    click_command: function(command){
      let repeatable = false
      let n = command.name
      if(!this.holdingDie || this.usedCommand(n)){
        return false
      }
      if(n === "釣り"){
        let c = this.holdingDie.num-2
        if(c <= 0){c = 1}
        if(this.worker_find("釣り人")){c += 3}
        this.res_find("魚").num += c
      
      } else if(n === "畑を耕す1"){
        this.field_die = this.holdingDie.num
        this.fields.push({kind:"空き"})
        if(this.worker_find("牛飼い") && this.res_find("牛")>0){this.fields.push({kind:"空き"})}

      } else if(n === "畑を耕す2"){
        if(this.field_die != this.holdingDie.num){return false}
        this.fields.push({kind:"空き"})
      
      } else if(n === "商人" || n === "行商人"){
        let item
        if(n === "商人"){item = this.items[this.holdingDie.num-1]}
        else if(n === "行商人"){item = this.items2[this.holdingDie.num-1]}
        if(this.isAnimal(this.res_find(item.name))){ //動物を買う場合
          if(!this.existEmptyFieldForAnimal(item.name)){return false;}
          if(!this.fields.find(e => e.kind === item.name)){this.empty_field.kind = item.name}
        }
        this.res_find(item.name).num += item.num
        repeatable = true
        if(this.worker_find("種まき人")) {this.fast_seeding(this.res_find(item.name))}
      
      } else if(n === "種を蒔く"){
        if(!this.empty_field){return false}
        this.status = "seeding"
        this.rest = this.holdingDie.num
      
      } else if(n === "契約"){
        if(this.worker_find("斡旋業者") && this.res_find("食料").num > 0){}
        else if(this.res_find("食料").num < this.holdingDie.num){return false}
        this.status = "contract"
        this.cost = this.holdingDie.num
        if(this.worker_find("斡旋業者")){this.cost = 1}
      
      } else if(n === "出荷"){
        this.rest = this.holdingDie.num+3
        if(this.worker_find("荷運び")){this.rest += 3}
        this.status = "market"
      
      } else if(n === "増築"){
        if(this.worker_find("大工")){}
        else if(this.holdingDie.num != 6){return false}
        this.status = "facility"

      } else if(n === "パン焼きかまど"){
        this.status = "bread"
        this.rest = this.holdingDie.num

      } else if(n === "バター工房"){
        this.status = "butter"
        this.rest = this.holdingDie.num
      } else if(n === "解体小屋"){
        if(this.res_find("鶏").num === 0 && this.res_find("羊").num === 0 && this.res_find("豚").num === 0 && this.res_find("牛").num === 0){
          return false
        }
        this.status = "butchering"
      } else {
        return false
      }
      if(!repeatable){this.usedCommands.push(command.name)}
      this.deleteDie()
    },

    doSeed: function(seed){
      let f = this.empty_field 
      f.kind = seed.name
      seed.num -= 1
      if(this.fast_seeding_kind){ //種まき人の効果は1回だけ
        this.status = ""
        this.fast_seeding_kind = ""
        return true;
      }
      this.decRest()
      if(!this.empty_field){
        this.status = ""
        this.rest = 0
      }
    },

    contractWorker: function(worker){
      this.contracted.push(worker)
      this.workers.splice(this.workers.indexOf(worker), 1)
      this.res_find("食料").num -= this.cost
      this.status = ""
      this.cost = 0
      if(worker.name === "行商人"){
        this.items2 = this.items.slice()
        if(this.turn < 3){this.items2.push({name:"牛",kind:"cow",num:1})} //行商人は1,2ターン目でも牛を出す
        this.items2.push({name:"宝石",kind:"jewel",num:1})
        this.shuffle(this.items2)
      }
    },

    makeFacility: function(facility){
      this.contracted.push(facility)
      this.facilities.splice(this.facilities.indexOf(facility), 1)
      this.status = ""
    },

    fast_seeding: function(res){
      if(this.isSeed(res) != true){return false}
      if(!this.fields.find(e => e.kind === "空き")){return false}
      this.status = "fast_seeding"
      this.fast_seeding_kind = res.name
    },

    deleteDie: function(){
      this.dice.splice(this.dice.indexOf(this.holdingDie), 1)
      this.holdingDie = ""
    },

    endTurn: function(){
      if(this.food_cost > this.res_find("食料").num){
        this.res_find("物乞い").num += this.food_cost - this.res_find("食料").num
        this.res_find("食料").num = 0
      } else {
        this.res_find("食料").num -= this.food_cost
      }

      this.res_find("勝利点").num += this.res_find("ウィスキー").num

      if(this.turn === 8){
        this.endGame = true
        this.countWorkerVP()
        this.res_find("勝利点").num -= this.res_find("物乞い").num-3
        this.res_find("勝利点").num += this.res_find("宝石").num*5
        return true;
      }

      this.turn += 1
      this.field_die = ""
      this.usedCommands = []
      this.workers = []
      
      if(this.turn === 3){this.items.push({name:"牛",kind:"cow",num:1})} //牛は3ターン目から出る
      this.shuffle(this.items)
      this.shuffle(this.items2)
      for(let i=0;i<this.aot[this.turn-1];i++){
        this.dice.push({num:Math.floor(Math.random()*6)+1})
      }
      for(let i=0;i<3;i++){
        this.workers.push(this.workers_deck.pop())
      }
      this.rotResource()
      this.growPlantsAndAnimals()
      if(this.worker_find("世話人")){this.res_find("食料").num+=2}
    },

    endCommand: function(){
      this.status = ""
    },

    rotResource: function(){
      let r = ["魚","野菜","卵","牛乳","花","肉","食料"]
      r.forEach(e => {
        if(!((this.res_find(e).name === "魚" || this.res_find(e).name === "肉") && this.worker_find("燻製小屋"))){
          //魚、肉は燻製器があると腐らなくなる
          this.res_find(e).num = 0
        }
      })
    },

    growPlantsAndAnimals: function(){
      let animals = [{a:"鶏",b:"卵"},{a:"羊",b:"羊毛"},{a:"牛",b:"牛乳"}]
      let w = this.worker_find("養蜂家")
      animals.forEach(e => {
        this.res_find(e.b).num += this.res_find(e.a).num
        if(e.a === "羊" && this.worker_find("毛刈り小屋")){
          this.res_find(e.b).num += Math.floor(this.res_find(e.a).num/2)
        }
      })
      this.fields.forEach(e => {
        if(e.kind === "麦の種"){
          this.res_find("麦").num += 3;
          this.res_find("麦の種").num += 1
          if(w){this.res_find("麦の種").num += 1}
        } else if(e.kind === "野菜の種"){
          this.res_find("野菜").num += 2;
          this.res_find("野菜の種").num += 1;
          if(w){this.res_find("野菜の種").num += 1}
        }else if(e.kind === "花の種"){
          this.res_find("花").num += 2
          if(w){this.res_find("花の種").num += 1}
        }
        if(!this.isAnimal(e.kind)){e.kind = "空き"}
      })
    },

    showButton: function(command,str){
      if(str === "終わる" ){
        if(this.status === "market" && command.name === "出荷"){
          return true;
        } else if(this.status === "seeding" && command.name === "種を蒔く"){
          return true;
        } else if(this.status === "bread" && command.name === "パン焼きかまど"){
          return true;
        } else if(this.status === "butter" && command.name === "バター工房"){
          return true;
        } else if(this.status === "butchering" && command.name === "解体小屋"){
          return true;
        } else if(this.status === "fast_seeding" && command.name === "種まき人"){
          return true;
        } 
      }else if(str === "出荷"){
        if(this.status === "market" && this.worker_find(command.name).change){
          return true;
        }
      }
    },

    showRest: function(command) {
      if(this.status === "seeding" && command.name === "種を蒔く"){
        return true;
      } else if(this.status === "trash_worker" && command.name === "募集"){
        return true;
      } else if(this.status === "market" && command.name === "出荷"){
        return true;
      } else if(this.status === "bread" && command.name === "パン焼きかまど"){
        return true
      } else if(this.status === "butter" && command.name === "バター工房"){
        return true;
      }
    },

    workerButtons: function(name){
      if(name === "役人"){
        return ["ひっくり返す"]
      } else if(name === "長老"){
        return ["+1","-1"]
      } else if(name === "精肉屋"){
        return ["鶏>肉1","羊>肉2","豚>肉3","牛>肉4"]
      } else if(name === "パン職人"){
        return [">食料2",">VP1"]
      } else if(name === "ソーセージ職人"){
        return [">食料2",">VP3"]
      }
    },

    showWorkerButtons(worker,button){
      if(worker.dice && this.holdingDie && !this.usedCommand(worker.name)){
        return true;
      } else if(this.status === "market"){
        return true;
      }
    },

    food_changeable: function(res){
      if(this.endGame){return false}
      let n = res.name
      if(this.status === "cooking"){
        if(this.resCooking === n){return false;} //料理中、すでに選んでいる食材はボタンを表示しない
      } else if(this.status != ""){
        return false
      }
      if(n==="魚" || n==="麦" || n==="野菜" || n==="卵" || n==="肉" || n==="バター" || n==="牛乳"){
        return true
      } else {
        return false
      }
    },

    isSeed: function(res){
      let n = res.name
      if(n==="麦の種" || n==="野菜の種" || n==="花の種"){
        return true
      } else {
        return false
      }
    },

    isAnimal: function(res){
      //文字列で来てもオブジェクトで来ても受け付ける
      if(res==="鶏" || res==="羊" || res==="豚" || res==="牛"){
        return true
      }
      let n = res.name
      if(n==="鶏" || n==="羊" || n==="豚" || n==="牛"){
        return true
      } else {
        return false
      }
    },

    sellable: function(res){
      let n = res.name
      if(n==="魚" || n==="野菜" || n==="花" || n==="卵" || n==="牛乳" || n==="羊毛" || n==="肉"){
        return true
      } else if(n === "麦" && res.num >= 2){
        return true
      } else {
        return false
      }
    },

    change_to_food: function(res){
      res.num -= 1
      this.res_find("食料").num += this.food_amount(res)
    },

    food_amount: function(res){
      if(res.name === "麦"){return 1}
      else if(res.name === "肉"){return 3}
      else{return 2}
    },

    change_to_vp: function(res){
      this.decRest()
      res.num -= 1
      if(res.name === "麦"){
        res.num -= 1
        this.res_find("勝利点").num += 1
      } else {
        this.res_find("勝利点").num += this.market_value(res)
      }
    },

    change_by_worker: function(name){
      if(name === "ハム職人"){
        let r = this.res_find("豚")
        if(r.num === 0){return false}
        r.num -= 1
        this.res_find("勝利点").num += 4
      } else if(name === "ウィスキー職人"){
        let r = this.res_find("麦")
        if(r.num < 2){return false}
        r.num -= 2
        this.res_find("ウィスキー").num += 1
      } else if(name === "精肉屋"){

      } else if(name === "花屋"){
        let r = this.res_find("花")
        if(r.num === 0){return false}
        r.num -= 1
        this.res_find("勝利点").num += 3
        this.res_find("花の種").num += 1
      } else if(name === "チーズ職人"){
        let r = this.res_find("牛乳")
        if(r.num === 0){return false}
        r.num -= 1
        this.res_find("勝利点").num += 2
      } else if(name === "仕立て屋"){
        let r = this.res_find("羊毛")
        if(r.num < 3){return false}
        r.num -= 3
        this.res_find("勝利点").num += 8
      } else if(name === "パン職人"){

      } else if(name === "菓子職人"){
        let a = this.res_find("麦"),b = this.res_find("牛乳"),c = this.res_find("卵")
        if(a.num === 0 || b.num === 0 || c.num === 0){return false}
        a.num -= 1
        b.num -= 1
        c.num -= 1
        this.res_find("勝利点").num += 6
      }
      this.decRest()
    },

    res_find: function(name){
      return this.resources.find(e => e.name === name);
    },

    worker_find: function(name){
      return this.contracted.find(e => e.name === name);
    },

    not_enough_food: function(res){
      return (res.name === "食料" && res.num < this.food_cost)
    },

    dice_img: function(n){
      return "d"+(n)+".png"
    },

    resShow: function(res){
      return res.num > 0 || res.name==="食料" || res.name==="勝利点"
    },

    show_if_res_command: function(res){
      let n = res.name
      if(this.status === "market" && this.sellable(res)){
        return true;
      } else if(this.status === "seeding" && this.isSeed(res)){
        return true
      } else if(this.status === "bread" && n === "麦"){
        return true
      } else if(this.status === "butter" && n === "牛乳"){
        return true
      } else if(this.status === "butchering" && this.isAnimal(res)){
        return true
      } else if(this.status === "fast_seeding" && this.fast_seeding_kind === res.name) {
        return true
      }
      return false
    },

    startCooking: function(){
      if(this.status === "cooking"){
        this.status = ""
        this.resCooking = ""
      } else {
        this.status = "cooking"
      }
    },

    clickResCook: function(res){
      if(this.status === "cooking"){
        let c = this.resCooking
        if(!c){
          this.resCooking = res.name
        } else {
          this.res_find(c).num -= 1
          res.num -= 1
          this.res_find("食料").num += 3
          this.resCooking = ""
          this.status = ""
        }
      } else {
        res.num -= 1
        this.res_find("食料").num += 1
      }
    },

    clickResCommand: function(res){
      if(this.status === "market"){
        this.change_to_vp(res)
      } else if(this.status === "seeding" || this.status === "fast_seeding"){
        this.doSeed(res)
      } else if(this.status === "bread"){
        res.num -= 1
        this.res_find("食料").num += 2
        this.decRest()
      } else if(this.status === "butter"){
        res.num -= 1
        this.res_find("バター").num += 1
        this.decRest()
      } else if(this.status === "butchering"){
        res.num -= 1
        this.res_find("肉").num += this.meatAmount(res)
        this.status = ""
      }
    },

    clickWorkerCommand(worker,button){
      let n = worker.name
      if(n === "長老"){
        if(button === "+1"){
          if(this.holdingDie.num === 6){return false}
          this.dice.push({num:this.holdingDie.num+1})
        } else if(button === "-1"){
          if(this.holdingDie.num === 1){return false}
          this.dice.push({num:this.holdingDie.num-1})
        }
        this.usedCommands.push(worker.name)
        this.deleteDie()

      } else if(n === "役人"){
        this.dice.push({num:7-this.holdingDie.num})
        this.usedCommands.push(worker.name)
        this.deleteDie()

      } else if(n === "パン職人"){
        let r = this.res_find("麦")
        if(r.num <= 0){return false}
        r.num -= 1
        this.decRest()
        if(button === ">食料2"){
          this.res_find("食料").num += 2
        } else if(button === ">VP1"){
          this.res_find("勝利点").num += 1
        }
      } else if(n === "ソーセージ職人"){
        let r = this.res_find("肉")
        if(r.num <= 0){return false}
        r.num -= 1
        this.decRest()
        if(button === ">食料2"){
          this.res_find("食料").num += 2
        } else if(button === ">VP3"){
          this.res_find("勝利点").num += 3
        }
      } else if(n === "精肉屋"){
        meat = ""
        if(button === "鶏>肉1"){
          meat = "鶏"
        } else if(button === "羊>肉2"){
          meat = "羊"
        } else if(button === "豚>肉3"){
          meat = "豚"
        } else if(button === "牛>肉4"){
          meat = "牛"
        }
        r = this.res_find(meat)
        if(r.num <= 0){return false}
        r.num -= 1
        this.decRest()
        this.res_find("肉").num += this.meatAmount(r)
      }
    },

    food_change_str: function(res){
      if(this.status === "" || this.status === "bread" || this.status === "butter"){
        return ">食料1"
      } else if(this.status === "cooking") {
        return "料理"
      }
    },

    res_command_str: function(res){
      let n = res.name
      if(this.status === "market"){
        if(n === "麦"){
          return "2>1VP"
        }
        return ">"+this.market_value(res)+"VP"
      } else if(this.status === "seeding" || this.status === "fast_seeding"){
        return "蒔く"
      } else if(this.status === "bread" && n === "麦"){
        return ">2食料"
      } else if(this.status === "butter" && n === "牛乳"){
        return ">バター"
      } else if(this.status === "butchering" && this.isAnimal(res)){
        return ">肉"+this.meatAmount(res)
      } 
    },

    cooking_button_str: function(){
      if(this.status === ""){return "料理"}
      else if(this.status === "cooking"){return "やめる"}
    },

    market_value: function(res){
      let r = res.name
      if(r === "魚" || r === "卵" || r === "野菜" || r === "牛乳" || r === "羊毛"){
        return 1
      } else if(r === "花" || r === "肉"){
        return 2
      }
    },

    meatAmount: function(res){
      let n = res.name
      if(n === "鶏"){return 1}
      else if(n === "羊"){return 2}
      else if(n === "豚"){return 3}
      else if(n === "牛"){return 4}
    },

    existEmptyFieldForAnimal: function(name){
      if(!(name === "鶏" || name === "羊" || name === "豚" || name === "牛")){return false}
      if(this.fields.find(e => e.kind === name)){return true}
      else if(this.empty_field){return true}
      return false
    },

    countWorkerVP: function(){
      if(this.worker_find("会計士")){
        this.res_find("勝利点").num = Math.floor(this.res_find("勝利点").num*1.2)
      }
      if(this.worker_find("畜産学者") && this.res_find("鶏").num > 0 && this.res_find("羊").num > 0 && this.res_find("豚").num > 0 && this.res_find("牛").num > 0){
        this.res_find("勝利点").num += 10
      }
      if(this.worker_find("測量士") && this.fields.length >= 10){
        this.res_find("勝利点").num += 12
      }
      if(this.worker_find("牧師")){
        if(this.res_find("物乞い").num > 5){this.res_find("物乞い").num -= 5}
        else{this.res_find("物乞い").num = 0}
      }
    },

    usedCommand: function(name){
      return this.usedCommands.find(e => e === name);
    },

    selectItem: function(item){
      this.selectedItem = item;
    },

    showHowToPlay: function(){
      this.viewStatus = "howtoplay"
    },

    showRules: function(){
      this.viewStatus = "rules"
    },

    returnGame: function(){
      this.viewStatus = "game"
    },

    decRest(){
      this.rest -= 1
      if(this.rest === 0){this.status = ""}
    },

    shuffle: function(array){
      for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    },

  }
}

Vue.createApp(app).mount('#app')
