const app = {
  el: '#app',

  data() {
    return {
      mode: "normal",
      beta: false,
      viewStatus: "game",
      showAlert:false,
      small: false,
      omit: true,
      alert_str:"",
      tweet_str:"",
      turn:1,
      ranks:[],
      status:"",
      rest:0,
      cost:0,
      activeItem:"",
      selectedItem:"",
      holdingDie:"",
      field_die:"",
      sight_numbers:[],
      endGame:false,
      skip_trash_worker: false,
      merchants:[],
      merchants_str:["商人"],
      usedCommands:[],
      dice: [],
      workers: [],
      workers_deck: [],
      contracted:[],
      fields: [],
      resCooking: "",
      buffer:[],
      aot:[2,2,3,3,3,4,4,4],
      resources: [],
      commands: [
        {name:"釣り",des:"魚を得る 1,2:2 3,4:3 5,6:4"},
        {name:"畑を耕す",des:"畑を1つ増やす 同じ目なら2回可能"},
        {name:"種を蒔く",des:"任意の数、畑に種を蒔く"},
        {name:"商人",des:"リストの品物を買う 何回でも可",vendor:true},
        {name:"出荷",des:"市場か職人に出荷する(N+2回) 8Rだけ何回でも可",market:true},
        {name:"契約",des:"食料Nを払って職人1人と契約する"},
        {name:"募集",des:"職人をN人残して残りを捨て、補充する"},
        {name:"増築",des:"設備を1つ建てる 6しか置けない"},
        {name:"観光化",des:"ダイスの目をVPに変え、残りを返却 最大20"},
      ],
      items: [],
      items2:[],
      items_animal:[],
      items_seeds:[],
      items_foods:[],
      items_template: [
        [{name:"麦の種",num:2},{name:"野菜の種",num:2},{name:"花の種",num:2},{name:"鶏",num:1},{name:"豚",num:1},{name:"羊",num:1}],
        [{name:"麦の種",num:2},{name:"野菜の種",num:2},{name:"花の種",num:2},{name:"鶏",num:1},{name:"豚",num:1},{name:"羊",num:1},{name:"牛",num:1},{name:"宝石",num:1}],
        [{name:"鶏",num:1},{name:"羊",num:1},{name:"豚",num:1},{name:"牛",num:1},{name:"鶏",num:2},{name:"馬",num:1}],
        [{name:"麦の種",num:2},{name:"野菜の種",num:2},{name:"花の種",num:2},{name:"麦の種",num:3},{name:"野菜の種",num:3},{name:"花の種",num:3}],
        [{name:"牛乳",num:3},{name:"卵",num:3},{name:"魚",num:3},{name:"麦",num:4},{name:"肉",num:2},{name:"野菜",num:3}]
      ],
      facilities: [],
      vps:[],
      dice_table: [],
      worker_table: [],
      items_table: [],
      items_table_plus: [],
      merchants_item_table: [],
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
      return this.aot[this.turn-1]+1
    },
    alertFood(){
      if(this.res_find("食料").num < this.food_cost){
        return "(注意：食料が足りません！)"
      }
      return ""
    },
    enough_food_for_cook(){
      if(this.count_kind_of_food >= 2){return true}
      return false
    },
    count_kind_of_food(){
      let foods = ["魚","麦","野菜","卵","肉","バター","牛乳"]
      let c = 0
      foods.forEach(e=>{
        if(this.res_find(e).num>0){ c+=1 }
      })
      return c;
    },
    calcRank(){
      let score = this.res_find("VP").num-1
      if(score < 0){return 0}
      else if(Math.floor(score/10) >= 10){return 11}
      return Math.floor(score/10)+1
    },
    nextRound(){
      if(this.turn === 8){return "ゲーム終了"}
      else{return "次のラウンドへ"}
    },
    mode_str(){
      if(this.mode === "normal"){
        return "Dailyで遊ぶ"
      } else {
        return "Normalで遊ぶ"
      }
    },
    omit_str(){
      if(this.omit){
        return "省略OFF"
      } else {
        return "省略ON"
      }
    },
    vendors_list(){
      return [this.items,this.items2,this.items_animal,this.items_seeds,this.items_foods]
    },
    get_date_str(){
      let date = new Date()
      let date_str = ('00'+(date.getMonth()+1)).slice(-2)+('00'+date.getDate()).slice(-2)+date.getDay()
      return date_str
    },
    uncontracted_worker_str(){
      if(this.status === 'contract'){return "契約"}
      else if(this.status === 'trash_worker'){return "残す"}
      return false
    },
    status_market(){
      return (this.status === "market" || this.status === "horse_market")
    }
  },

  watch: {

  },

  created() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
    console.log("Dicey Farm ver 1.02")
    this.initGame()    
  },

  destroyed() {
    window.removeEventListener('resize', this.handleResize)
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
        let c = Math.ceil(this.holdingDie.num/2)+1
        if(this.worker_find("釣り人")){c += 3}
        this.res_find("魚").num += c
      
      } else if(n === "畑を耕す"){
        if(this.field_die){ //2回目の場合
          if(this.field_die != this.holdingDie.num){
            this.addAlert("同じ目のダイス("+this.field_die+")のみ使えます")
            return false
          }
        } else { //1回目の場合
          this.field_die = this.holdingDie.num
          repeatable = true
        }
        this.fields.push({kind:"空き"})
        if(this.worker_find("牛飼い") && this.res_find("牛").num>0){this.fields.push({kind:"空き"})}

      } else if(command.vendor){ //商人系のアクション
        let item = this.vendors_list[this.getVendorID(n)][this.holdingDie.num-1]
          
        if(this.isAnimal(this.res_find(item.name)) || item.name === "馬"){ //動物を買う場合
          if(item.name === "馬" && this.worker_find("馬小屋")){
            // 馬小屋がある場合は空いた畑のチェックを飛ばす
          } else if(!this.existEmptyFieldForAnimal(item.name)){
            this.addAlert("新しい家畜を買うための空いた畑がありません")
            return false;
          } else if(!this.fields.find(e => e.kind === item.name)){
            this.empty_field.kind = item.name
          }
        }
        if(item.name === "馬" && !this.worker_find("馬")){
          this.contracted.push({name:"馬",des:"ダイスを使わない 2回出荷する",market:true})
        }
        this.res_find(item.name).num += item.num
        repeatable = true
      
      } else if(n === "種を蒔く"){
        if(!this.empty_field){
          this.addAlert("空いている畑がありません")
          return false
        }
        this.status = "seeding"
        if(this.worker_find("種まき人")) {this.dice.push({num:1})}
      
      } else if(n === "契約"){
        if(this.worker_find("斡旋業者") && this.res_find("食料").num > 0){}
        else if(this.res_find("食料").num < this.holdingDie.num){
          this.addAlert("食料が足りません")
          return false
        }
        this.status = "contract"
        this.cost = this.holdingDie.num
        if(this.worker_find("斡旋業者")){
          this.cost = 1
          repeatable = true
        }

      } else if(n === "募集"){
        if(this.holdingDie.num > this.workers.length){
          this.addAlert(this.holdingDie.num + "人の職人を残すことはできません")
          return false
        }
        this.rest = this.holdingDie.num
        this.status = "trash_worker"
        this.skip_trash_worker = true

      } else if(n === "出荷"){
        this.rest = this.holdingDie.num+2
        if(this.worker_find("荷運び")){this.rest += 3}
        this.rest += this.res_find("馬").num
        this.status = "market"
        if(this.turn === 8){repeatable = true}
      
      } else if(n === "増築"){
        if(this.worker_find("大工")){}
        else if(this.holdingDie.num != 6){
          this.addAlert("6のダイスのみ使えます")
          return false
        }
        this.status = "facility"

      } else if(n === "観光化"){
        for(let i=1;i<this.holdingDie.num+1;i++){
          this.sight_numbers.push(i)
        }
        this.status = "touristy"
        this.cost = this.holdingDie.num

      } else if(n === "日雇い労働"){
        this.res_find("食料").num += 3

      } else if(n === "パン焼き釜"){
        this.status = "bread"
        this.rest = this.holdingDie.num

      } else if(n === "解体小屋"){
        if(this.res_find("鶏").num === 0 && this.res_find("羊").num === 0 && this.res_find("豚").num === 0 && this.res_find("牛").num === 0){
          this.addAlert("家畜が一頭もいません")
          return false
        }
        this.status = "butchering"
        this.rest = this.holdingDie.num

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
      if(!this.empty_field){
        this.status = ""
      }
    },

    clickUncontractWorker(worker){
      if(this.status === "contract"){ this.contractWorker(worker) }
      else if(this.status === 'trash_worker'){ this.trashWorker(worker) }
    },

    contractWorker: function(worker){
      this.contracted.push(worker)
      this.workers.splice(this.workers.indexOf(worker), 1)
      this.res_find("食料").num -= this.cost
      this.status = ""
      this.cost = 0
      if(worker.vendor){
        let id = this.getVendorID(worker.name)
        this.vendors_list[id] = this.items_template[id].slice()
        this.merchants_str.push(worker.name)
        this.shuffleVendorFromTable(id)
      }
    },

    trashWorker: function(worker){
      worker.remain = true
      this.decRest()
      if(this.rest === 0){ 
        this.workers = this.workers.filter(e => e.remain)
        this.fillWorker() 
        this.workers.forEach(e=>{
          e.remain = false
        })
      }
    },

    makeFacility: function(facility){
      this.contracted.push(facility)
      this.facilities.splice(this.facilities.indexOf(facility), 1)
      this.status = ""
      if(facility.name === "燻製小屋"){
        this.res_find("肉").rot = ""
        this.res_find("魚").rot = "" 
      } else if(facility.name === "馬小屋"){
        this.res_find("馬").num += 1
        if(!this.worker_find("馬")){
          this.contracted.push({name:"馬",des:"ダイスを使わない 2回出荷する",market:true})
        }
        if(this.fields.find(f => f.kind === "馬")){
          this.fields.find(f => f.kind === "馬").kind = "空き"
        }
      }
    },

    sight_die(n){
      this.memoVP("観光化",n)
      let vps = this.vps.find(e=>e.name==="観光化")
      if(vps.num >= 20){ vps.num = 20 }
      if(this.cost-n > 0){this.dice.push({num:this.cost-n})}
      this.status = ""
      this.cost = ""
      this.sight_numbers = []
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

      this.memoVP("ウィスキー",this.res_find("ウィスキー").num)

      if(this.turn === 8){
        this.endGame = true
        this.memoVP("宝石",this.res_find("宝石").num*7)
        this.countWorkerVP()
        this.memoVP("物乞い",(this.res_find("物乞い").num*3)*(-1))

        this.saveScore()
        this.tweet_str = "https://twitter.com/intent/tweet?hashtags=dicey_farm&ref_src=twsrc%5Etfw%7Ctwcamp%5Ebuttonembed%7Ctwterm%5Eshare%7Ctwgr%5E&text="+
        "score: "+this.res_find("VP").num+" "+this.mvp_str()
        if(this.mode === "daily"){this.tweet_str += " %23ddf"+this.get_date_str.slice(0,-1)}
        this.tweet_str += "&url=http%3A%2F%2Fintotheprow.sakura.ne.jp%2Fdicey_farm%2F"
        return true;
      }

      this.turn += 1
      this.field_die = ""
      this.usedCommands = []
      
      if(this.turn === 3){
        this.items_template[0].push({name:"牛",num:1})
      } //牛は3ターン目から出る
      
      if(this.mode === "daily"){
        this.merchants = []
        this.merchants_str.forEach(e=>{
          this.shuffleVendorFromTable(this.getVendorID(e))
        })
      } else {
        this.vendors_list.forEach(e => {
          this.shuffle(e)
        })
      }

      let n = 0
      for(let i=0;i<this.aot[this.turn-1];i++){
        if(this.mode === "daily"){n = this.dice_table.shift()}
        else{n = Math.floor(Math.random()*6)+1}
        this.dice.push({num:n})
      }
      
      if(this.skip_trash_worker){
        this.skip_trash_worker = false
      } else {
        this.workers.splice(0, 2)
      }
      this.fillWorker()

      this.rotResource()
      this.growPlantsAndAnimals()
      if(this.worker_find("世話人")){this.res_find("食料").num+=2}
      this.makeBuffer()
    },

    endCommand(name){
      this.status = ""
      if(this.rest === 0){return true}
      if(name === "パン焼き釜" || name === "解体小屋"){
        this.dice.push({num:this.rest})
      }
      this.rest = 0
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
      let animal_num = 0
      let compost = 0
      
      animal_num += this.res_find("豚").num
      animals.forEach(e => {
        animal_num += this.res_find(e.a).num
        this.res_find(e.b).num += this.res_find(e.a).num
        if(e.a === "羊" && this.worker_find("羊飼い")){
          this.res_find(e.b).num += Math.floor(this.res_find(e.a).num/2)
        }
      })
      if(this.worker_find("堆肥小屋")){
        if(animal_num >= 4){compost = 2}
        else if(animal_num >= 1){compost = 1}
      }
      this.fields.forEach(e => {
        if(e.kind === "麦の種"){
          this.res_find("麦").num += 3 + compost;
          this.res_find("麦の種").num += 1
          if(w){this.res_find("麦の種").num += 1}
        } else if(e.kind === "野菜の種"){
          this.res_find("野菜").num += 2 + compost;
          this.res_find("野菜の種").num += 1;
          if(w){this.res_find("野菜の種").num += 1}
        }else if(e.kind === "花の種"){
          this.res_find("花").num += 2 + compost
          if(w){this.res_find("花の種").num += 1}
        }
        if(!(this.isAnimal(e.kind) || e.kind === "馬")){e.kind = "空き"}
      })
    },

    fillWorker(){
      let wc = this.workers.length
      for(let i=0;i<6-wc;i++){
        if(this.workers_deck.length > 0){
          this.workers.push(this.workers_deck.shift())
        }
      }
    },

    showButton: function(command,str){
      if(str === "終わる" ){
        if(this.status === "market" && command.name === "出荷"){
          return true;
        } else if(this.status === "seeding" && command.name === "種を蒔く"){
          return true;
        } else if(this.status === "bread" && command.name === "パン焼き釜"){
          return true;
        } else if(this.status === "butchering" && command.name === "解体小屋"){
          return true;
        }
      } else if(str === "出荷"){
        if(this.status_market && this.worker_find(command.name).change){
          return true;
        }
      }
    },

    showFieldDie(name){
      if(name === "畑を耕す" && this.field_die){
        return "["+this.field_die+"]"
      }
    },

    workerButtons: function(name){
      if(name === "役人"){
        return ["ひっくり返す"]
      } else if(name === "長老"){
        return ["+1","-1"]
      } else if(name === "夜警"){
        return ["2","5"]  
      } else if(name === "精肉屋"){
        return ["鶏>肉2","羊>肉4","豚>肉6","牛>肉8"]
      } else if(name === "パン職人"){
        return ["麦1>食料2","麦2>VP2"]
      } else if(name === "ソーセージ職人"){
        return [">食料2",">VP3"]
      } else if(name === "馬"){
        if(this.status === "horse_market"){ return ["終わる"] }
        else { return ["出荷"] }
      }
    },

    showWorkerButtons(worker,button){
      if(worker.name === "馬"){
        if(this.status === "" && !this.usedCommand(worker.name)){
          return true; // 「出荷」を表示
        } else if(this.status === "horse_market"){
          return true; // 「終わる」を表示
        }
      } else if(worker.dice && this.holdingDie && !this.usedCommand(worker.name)){
        return true;
      } else if(this.status_market && !worker.dice){
        return true;
      }
    },

    showUncontractedWorkerButton(worker){
      if(this.status === 'contract'){
        return true
      } else if(this.status === 'trash_worker' && !worker.remain){
        return true
      }
      return false
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
      if(n==="魚" || n==="野菜" || n==="花" || n==="卵" || n==="牛乳" || n==="羊毛" || n==="肉" || n==="バター"){
        return true
      } else if(n === "麦" && res.num >= 2){
        return true
      } else {
        return false
      }
    },

    change_to_vp: function(res){
      this.decRest()
      res.num -= 1
      if(res.name === "麦"){
        res.num -= 1
        this.memoVP("市場",1)
      } else {
        this.memoVP("市場",this.market_value(res))
      }
    },

    change_by_worker: function(name){
      if(name === "ハム職人"){
        let r = this.res_find("豚")
        if(r.num === 0){return false}
        r.num -= 1
        this.memoVP("ハム職人",9)
        this.checkFieldsFilled()
      } else if(name === "ウィスキー職人"){
        let r = this.res_find("麦")
        if(r.num < 2){return false}
        r.num -= 2
        this.res_find("ウィスキー").num += 1
      } else if(name === "花屋"){
        let r = this.res_find("花")
        if(r.num === 0){return false}
        r.num -= 1
        this.memoVP("花屋",4)
      } else if(name === "チーズ職人"){
        let r = this.res_find("牛乳")
        if(r.num === 0){return false}
        r.num -= 1
        this.memoVP("チーズ職人",5)
      } else if(name === "仕立て屋"){
        let r = this.res_find("羊毛")
        if(r.num < 3){return false}
        r.num -= 3
        this.memoVP("仕立て屋",6)
      } else if(name === "菓子職人"){
        let a = this.res_find("麦"),b = this.res_find("牛乳"),c = this.res_find("卵")
        if(a.num === 0 || b.num === 0 || c.num === 0){return false}
        a.num -= 1
        b.num -= 1
        c.num -= 1
        this.memoVP("菓子職人",9)
      } else if(name === "料理人"){
        let a = this.res_find("魚"),b = this.res_find("肉"),c = this.res_find("野菜")
        if(a.num === 0 || b.num === 0 || c.num === 0){return false}
        a.num -= 1
        b.num -= 1
        c.num -= 1
        this.memoVP("料理人",10)
      }
      this.decRest()
    },

    res_find: function(name){
      return this.resources.find(e => e.name === name);
    },

    worker_find: function(name){
      if(name === "商人"){
        return {name:"商人"} //アクションだが商品スロットの処理の関係で職人として返さないといけないことがある
      }
      return this.contracted.find(e => e.name === name);
    },

    vp_find(name){
      return this.vps.find(e => e.name === name)
    },

    not_enough_food: function(res){
      return (res.name === "食料" && res.num < this.food_cost)
    },

    dice_img: function(n){
      return "d"+(n)+".png"
    },

    resShow: function(res){
      return res.num > 0 || res.name==="食料" || res.name==="VP"
    },

    show_if_res_command: function(res){
      let n = res.name
      if(this.status_market && this.sellable(res)){
        return true;
      } else if(this.status === "seeding" && this.isSeed(res)){
        return true
      } else if(this.status === "bread" && n === "麦"){
        return true
      } else if(this.status === "butchering" && this.isAnimal(res)){
        return true
      } 
      return false
    },

    startCooking: function(){
      if(!this.enough_food_for_cook){return false}
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
        }
        if(!this.enough_food_for_cook){
          this.status = ""
        }
      } else {
        res.num -= 1
        this.res_find("食料").num += 1
      }
    },

    clickResCommand: function(res){
      if(this.status_market){
        this.change_to_vp(res)
      } else if(this.status === "seeding"){
        this.doSeed(res)
      } else if(this.status === "bread"){
        res.num -= 1
        this.res_find("食料").num += 2
        this.decRest()
      } else if(this.status === "butchering"){
        res.num -= 1
        this.res_find("肉").num += this.meatAmount(res)
        this.decRest()
        this.endCommand("解体小屋")
        this.checkFieldsFilled()
      }
    },

    clickWorkerCommand(worker,button){
      let n = worker.name
      if(n === "長老"){
        if(button === "+1"){
          if(this.holdingDie.num === 6){
            this.addAlert("6のダイスは+1できません")
            return false
          }
          this.dice.push({num:this.holdingDie.num+1})
        } else if(button === "-1"){
          if(this.holdingDie.num === 1){
            this.addAlert("1のダイスは-1できません")
            return false
          }
          this.dice.push({num:this.holdingDie.num-1})
        }
        this.usedCommands.push(worker.name)
        this.deleteDie()

      } else if(n === "役人"){
        this.dice.push({num:7-this.holdingDie.num})
        this.usedCommands.push(worker.name)
        this.deleteDie()

      } else if(n === "夜警"){
        if(button === "2"){
          this.dice.push({num:2})
        } else if(button === "5"){
          this.dice.push({num:5})
        }
        this.usedCommands.push(worker.name)
        this.deleteDie()

      } else if(n === "パン職人"){
        let r = this.res_find("麦")
        if(r.num <= 0){return false}
        if(button === "麦1>食料2"){
          r.num -= 1
          this.res_find("食料").num += 2
        } else if(button === "麦2>VP2"){
          if(r.num <= 1){return false}
          r.num -= 2
          this.memoVP("パン職人",2)
        }
        this.decRest()
      } else if(n === "ソーセージ職人"){
        let r = this.res_find("肉")
        if(r.num <= 0){return false}
        r.num -= 1
        this.decRest()
        if(button === ">食料2"){
          this.res_find("食料").num += 2
        } else if(button === ">VP3"){
          this.memoVP("ソーセージ職人",3)
        }
      } else if(n === "精肉屋"){
        meat = ""
        if(button === "鶏>肉2"){
          meat = "鶏"
        } else if(button === "羊>肉4"){
          meat = "羊"
        } else if(button === "豚>肉6"){
          meat = "豚"
        } else if(button === "牛>肉8"){
          meat = "牛"
        }
        let r = this.res_find(meat)
        if(r.num <= 0){return false}
        r.num -= 1
        this.decRest()
        this.res_find("肉").num += this.meatAmount(r)
        this.checkFieldsFilled()
      } else if(n === "馬"){
        if(button === "出荷"){
          this.rest = 2
          this.status = "horse_market"
          this.usedCommands.push("馬")
        } else if(button === "終わる"){
          this.endCommand("馬")
        }
      }
    },

    command_style(command){
      let name = command.name
      if(name === "商人"){
        return {vendor:true}
      } else if(name === "出荷"){
        return {market:true}
      } else if(name === "行商人"){
        return {merchant:true}
      } else if(name === "家畜商人"){
        return {animal_vendor:true}
      } else if(name === "園芸商人"){
        return {seed_vendor:true}
      } else if(name === "食材商人"){
        return {food_vendor:true}
      } else if(command.market){
        return {market:true}
      }
      return false
    },

    food_change_str: function(res){
      if(this.status === ""){
        return ">食料1"
      } else if(this.status === "cooking") {
        return "料理"
      }
    },

    res_command_str: function(res){
      let n = res.name
      if(this.status_market){
        if(n === "麦"){
          return "2>1VP"
        }
        return ">"+this.market_value(res)+"VP"
      } else if(this.status === "seeding"){
        return "蒔く"
      } else if(this.status === "bread" && n === "麦"){
        return ">2食料"
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
      } else if(r === "花" || r === "肉" || r === "バター"){
        return 2
      }
    },

    meatAmount: function(res){
      let n = res.name
      if(n === "鶏"){return 2}
      else if(n === "羊"){return 4}
      else if(n === "豚"){return 6}
      else if(n === "牛"){return 8}
    },

    existEmptyFieldForAnimal: function(name){
      if(name != "鶏" && name != "羊" && name != "豚" && name != "牛" && name != "馬"){return false}
      if(this.fields.find(e => e.kind === name)){return true}
      else if(this.empty_field){return true}
      return false
    },

    checkFieldsFilled(){  //家畜が減った後、畑を空にする処理
      let animals = ["鶏","羊","豚","牛"]
      animals.forEach(e => {
        if(this.res_find(e).num === 0 && this.fields.find(f => f.kind === e)){
          this.fields.find(f => f.kind === e).kind = "空き"
        }
      })
    },

    countWorkerVP: function(){
      if(this.worker_find("畜産学者")){
        let c = 0
        while(this.res_find("鶏").num > c && this.res_find("羊").num > c && this.res_find("豚").num > c && this.res_find("牛").num > c){
          this.memoVP("畜産学者",20)
          c += 1
        }
      }
      if(this.worker_find("測量士") && this.fields.length >= 8){
        this.memoVP("測量士",25)
      }
      if(this.worker_find("牧師")){
        if(this.res_find("物乞い").num > 5){this.res_find("物乞い").num -= 5}
        else{this.res_find("物乞い").num = 0}
      }
      if(this.worker_find("会計士")){
        this.memoVP("会計士",Math.floor(this.res_find("VP").num/12))
      }
      if(this.worker_find("ツアーガイド") && this.vps.find(e=>e.name==="観光化").num === 20){
        this.memoVP("観光化",10)
      }
    },

    memoVP(name,pt){
      this.res_find("VP").num += pt
      this.vp_find(name).num += pt
    },

    showVP(vp){
      if(vp.num != 0){return true}
      else{return false}
    },

    usedCommand: function(name){
      return this.usedCommands.find(e => e === name);
    },

    saveScore(){
      let rankdata = []
      if(!localStorage.getItem("dicey_farm_score")){rankdata = [0,0,0,0,0,0,0,0,0,0,0,0]}
      else{rankdata = localStorage.getItem("dicey_farm_score").split(',').map(Number);}
      rankdata[this.calcRank] += 1
      localStorage.setItem('dicey_farm_score', rankdata)
      this.ranks = rankdata
    },

    resetStats(){
      let rankdata = [0,0,0,0,0,0,0,0,0,0,0,0]
      localStorage.setItem('dicey_farm_score', rankdata)
      this.ranks = rankdata
    },

    recentResult(index){
      return (index === this.calcRank)
    },

    selectItem: function(item){
      this.selectedItem = item;
    },

    showHowToPlay: function(){
      this.viewStatus = "howtoplay"
    },

    showRules: function(){
      let URL = 'https://github.com/vivit-jc/dicey_farm/blob/main/rule.md';
      let Name = 'dicey_farm_rule';
      window.open(URL,Name);
    },

    showBeta: function(){
      let URL = 'https://github.com/vivit-jc/dicey_farm/blob/main/beta.md';
      let Name = 'dicey_farm_beta_doc';
      window.open(URL,Name);
    },

    showUpdates: function(){
      let URL = 'https://github.com/vivit-jc/dicey_farm/blob/main/updates.md';
      let Name = 'dicey_farm_updates_doc';
      window.open(URL,Name);
    },

    tweet_open(){
      let URL = this.tweet_str
      let Name = 'dicey_farm_tweet';
      window.open(URL,Name);
    },

    returnGame: function(){
      this.viewStatus = "game"
    },

    rank_str(index){
      if(index == 0){return "~0"}
      else if(index === 11){return "101~"}
      else{return (index*10-9)+"~"+index*10}
    },

    decRest(){
      this.rest -= 1
      if(this.rest === 0){this.status = ""}
    },

    getVendorID(name){
      return ["商人","行商人","家畜商人","園芸商人","食材商人"].indexOf(name)
    },

    addAlert(msg){
      this.alert_str = msg
      this.showAlert = true
      setTimeout(() => {
        this.alert_str = ""
        this.showAlert = false
      }, 4000);
    },

    shuffle: function(array){
      for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    },

    setTooltip(){
      window.addEventListener("load", function() {
        let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
        });
      });
    },

    makeBuffer(){
      this.buffer.resources = JSON.parse(JSON.stringify(this.resources));
      this.buffer.merchants = this.merchants.slice()
      this.buffer.merchants_str = this.merchants_str.slice()
      this.buffer.workers = this.workers.slice()
      this.buffer.workers_deck = this.workers_deck.slice()
      this.buffer.contracted = this.contracted.slice()
      this.buffer.facilities = this.facilities.slice()
      this.buffer.vps = JSON.parse(JSON.stringify(this.vps));
      this.buffer.fields = JSON.parse(JSON.stringify(this.fields));
      this.buffer.sightDice = this.sightDice.slice()
      this.buffer.dice = this.dice.slice()
    },

    loadBuffer(){
      this.resources = JSON.parse(JSON.stringify(this.buffer.resources));
      this.merchants = this.buffer.merchants.slice()
      this.merchants_str = this.buffer.merchants_str.slice()
      this.workers = this.buffer.workers.slice()
      this.workers_deck = this.buffer.workers_deck.slice()
      this.contracted = this.buffer.contracted.slice()
      this.facilities = this.buffer.facilities.slice()
      this.vps = JSON.parse(JSON.stringify(this.buffer.vps));
      this.fields = JSON.parse(JSON.stringify(this.buffer.fields));
      this.sightDice = this.buffer.sightDice.slice()
      this.dice = this.buffer.dice.slice()

      this.field_die = ""
      this.usedCommands = []
    },

    changeMode(){
      this.mode = (this.mode === "daily") ? "normal" : "daily"
      this.initGame()
    },

    initGame(){
      this.dice = []
      this.workers = []
      this.turn = 1
      this.endGame = false
      this.merchants = []
      this.merchants_str = ["商人"]
      this.workers = []
      this.contracted = []
      this.fields = [{kind:"空き"}]
      this.field_die = ""
      this.rest = 0
      this.status = ""
      this.resCooking = ""
      this.holdingDie = ""
      this.sightDice = []
      this.usedCommands = []
      this.items2 = []
      this.items_animal = []
      this.items_seeds = []
      this.items_foods = []
      this.resources = [
        {name:"VP",num:0},
        {name:"物乞い",num:0},
        {name:"食料",num:3,rot:"▲"},
        {name:"魚",num:0,rot:"▲"},
        {name:"麦",num:0},
        {name:"野菜",num:0,rot:"▲"},
        {name:"花",num:0,rot:"▲"},
        {name:"麦の種",num:0},
        {name:"野菜の種",num:0},
        {name:"花の種",num:0},
        {name:"鶏",num:0},
        {name:"羊",num:0},
        {name:"豚",num:0},
        {name:"牛",num:0},
        {name:"馬",num:0},
        {name:"肉",num:0,rot:"▲"},
        {name:"卵",num:0,rot:"▲"},
        {name:"牛乳",num:0,rot:"▲"},
        {name:"バター",num:0},
        {name:"羊毛",num:0},
        {name:"ウィスキー",num:0},
        {name:"宝石",num:0},
      ]
      this.workers_deck = [
        //変換方法が複数ある職人はchange:trueを付けないことに注意
        {name:"釣り人",des:"釣りで得る魚+3",passive:true},
        {name:"荷運び",des:"出荷の回数+3",passive:true},
        {name:"斡旋業者",des:"契約コストが1になる 毎ラウンド何度でも契約を行える",passive:true},
        {name:"大工",des:"どのダイスでも増築できる",passive:true},
        {name:"行商人",des:"買い物スロットを追加",vendor:true},
        {name:"家畜商人",des:"買い物スロットを追加",vendor:true},
        {name:"園芸商人",des:"買い物スロットを追加",vendor:true},
        {name:"食材商人",des:"買い物スロットを追加",vendor:true},
        {name:"養蜂家",des:"麦、野菜、花の収穫時に得る種+1",passive:true},
        {name:"牛飼い",des:"牛がいれば1回で2つの畑を耕せる",passive:true},
        {name:"羊飼い",des:"毎ラウンド終了時、羊2匹につき追加の羊毛1を得る",passive:true},
        {name:"世話人",des:"毎ラウンド開始時、食料2を得る",passive:true},
        {name:"種まき人",des:"種を蒔くアクションの後、1のダイスを得る",passive:true},
        {name:"パン職人",des:"麦1つを2食料に変えるか、麦2つを2VPに変える",market:true},
        {name:"菓子職人",des:"麦、卵、牛乳を9VPに変える",change:true,market:true},
        {name:"ウィスキー職人",des:"麦2つをウィスキーに変える",change:true,market:true},
        {name:"チーズ職人",des:"牛乳を5VPに変える",change:true,market:true},
        {name:"精肉屋",des:"家畜を肉に変える 鶏:2 羊:4 豚:6 牛:8",market:true},
        {name:"ハム職人",des:"豚を9VPに変える",change:true,market:true},
        {name:"仕立て屋",des:"3羊毛を6VPに変える",change:true,market:true},
        {name:"花屋",des:"花を4VPに変える",change:true,market:true},
        {name:"ソーセージ職人",des:"肉を2食料か3VPに変える",market:true},
        {name:"料理人",des:"魚、肉、野菜を10VPに変える",change:true,market:true},
        {name:"長老",des:"ダイス1つの目を+1か-1する",dice:true},
        {name:"役人",des:"ダイス1つの目をひっくり返す",dice:true},
        {name:"夜警",des:"ダイス1つの目を2か5にする",dice:true},
        {name:"畜産学者",des:"ゲーム終了時、鶏、羊、豚、牛のセットが1つにつき20VP",passive:true},
        {name:"測量士",des:"ゲーム終了時、畑が8以上あれば25VP",passive:true},
        {name:"会計士",des:"ゲーム終了時、12VPにつき1VP得る",passive:true},
        {name:"ツアーガイド",des:"ゲーム終了時、観光化で20VPを得ていれば10VP",passive:true},
        {name:"牧師",des:"ゲーム終了時、物乞いを5回まで無視する",passive:true},
      ]
      this.items_template[0] = [
        {name:"麦の種",num:2},
        {name:"野菜の種",num:2},
        {name:"花の種",num:2},
        {name:"鶏",num:1},
        {name:"豚",num:1},
        {name:"羊",num:1},
      ]
      this.items = this.items_template[0]

      this.facilities = [
        {name:"パン焼き釜",des:"麦を2食料に変える 残りを返却",action:true},
        {name:"解体小屋",des:"家畜1頭を肉に変える 鶏:2 羊:4 豚:6 牛:8 (N-1)を返却",action:true},
        {name:"堆肥小屋",des:"家畜が1~3頭なら、麦、野菜、花の収穫量+1、4頭以上なら+2",passive:true},
        {name:"燻製小屋",des:"肉、魚が腐らなくなる",passive:true},
        {name:"馬小屋",des:"馬を1つ得る 馬は畑を専有しない",passive:true},
      ]
      this.vps = [
        {name:"市場",num:0},
        {name:"観光化",num:0},
        {name:"ウィスキー",num:0},
        {name:"宝石",num:0},
        {name:"パン職人",num:0},
        {name:"菓子職人",num:0},
        {name:"チーズ職人",num:0},
        {name:"ハム職人",num:0},
        {name:"仕立て屋",num:0},
        {name:"ソーセージ職人",num:0},
        {name:"花屋",num:0},
        {name:"料理人",num:0},
        {name:"測量士",num:0},
        {name:"畜産学者",num:0},
        {name:"会計士",num:0},
        {name:"物乞い",num:0},
      ]

      this.setupRand()

      if(this.mode === "normal"){
        this.shuffle(this.items)
        this.merchants.push(this.items)
        this.shuffle(this.workers_deck)

        for(let i=0;i<2;i++){
          this.dice.push({num:Math.floor(Math.random()*6)+1})
        }
      } else {
        this.initDailyData()
      }

      this.fillWorker()

      this.makeBuffer()
    },

    initDailyData(){
      for(let i=0;i<2;i++){
        this.dice.push({num:this.dice_table.shift()})
      }

      this.shuffleVendorFromTable(0)
    },

    setupRand(){
      let rand = new Chance(this.get_date_str)

      this.dice_table = []
      for(let i=0;i<25;i++){
        this.dice_table.push(rand.d6())
      }

      this.workers_deck = rand.shuffle(this.workers_deck)
      
      this.items_table = []
      for(let i=0;i<8;i++){
        this.items_table.push(rand.shuffle([0,1,2,3,4,5,6,7]))
      }

      this.merchants_item_table = []
      for(let i=0;i<5;i++){
        this.merchants_item_table.push(rand.shuffle([0,1,2,3,4,5,6,7]))
      }
      
    },

    shuffleVendorFromTable(id){
      let temp_items = []
      this.items_table[this.merchants_item_table[id][this.turn-1]].forEach(e => {
        temp_items.push(this.items_template[id][e])
      })
      this.vendors_list[id] = temp_items.filter(e => e) //undefinedを取り除く
      this.merchants.push(this.vendors_list[id])
    },

    mvp_str(){
      let vp_sorted = this.vps.sort(function (a, b) {
        return b.num - a.num;
      });
      
      if(this.res_find("VP").num <= 30){
        return "俺たちの牧場はこれからだ！"
      } else if(vp_sorted[0].num >= 20){
        if(vp_sorted[0].name === "市場"){
          return "多くの仲買人にとって、あなたの牧場の品物ほど信頼の置ける存在はない"
        } else if(vp_sorted[0].name === "観光化"){
          return "あなたの牧場に来る観光客のおかげで、牧場だけでなく町全体の経済も潤っている"
        } else if(vp_sorted[0].name === "ウィスキー"){
          return "あなたの牧場で作られたウィスキーが、この地方の新たな名物として全国的に認知されている"
        } else if(vp_sorted[0].name === "宝石"){
          return "牧場主としてだけでなく、宝石コレクターとしてもあなたの名は知れ渡っている"
        } else if(vp_sorted[0].name === "パン職人"){
          return "町の人々は、あなたの牧場の麦で出来たパンを食べないと一日が始まらないと口を揃える"
        } else if(vp_sorted[0].name === "菓子職人"){
          return "こだわりの素材で作られたお菓子が、町の人々に毎日のささやかな幸せを運んでいる"
        } else if(vp_sorted[0].name === "チーズ職人"){
          return "あなたの牧場で作られたチーズが、全国の料理人の注目を集めている"
        } else if(vp_sorted[0].name === "ハム職人"){
          return "あなたの牧場で作られたハムが、贈呈品の新しい定番になりつつある"
        } else if(vp_sorted[0].name === "仕立て屋"){
          return "町の人々は、普段着ている服がすべてあなたの牧場の羊の毛から出来ていることに気付いていない"
        } else if(vp_sorted[0].name === "ソーセージ職人"){
          return "あなたの牧場で作られたソーセージは、どんな食べ方をしても美味いと評判になっている"
        } else if(vp_sorted[0].name === "花屋"){
          return "あなたの牧場の花は、町の人々の何気ない日々の暮らしを美しく彩っている"
        } else if(vp_sorted[0].name === "料理人"){
          return "最高の食材と最高の技で作られた料理を求めて、連日遠くからたくさんの人がこの町にやってくる"
        } else if(vp_sorted[0].name === "測量士"){
          return "あなたの牧場が常に拡大し続けるせいで、町は専属の測量士を雇うことになった"
        } else if(vp_sorted[0].name === "畜産学者"){
          return "家畜と経営の相互作用について、畜産学会はあなたの牧場を興味深い事例として注目している"
        } else if(vp_sorted[0].name === "会計士"){
          return "国内でも有数の巨額納税者として、あなたの牧場には色んな意味で熱い視線が送られている"
        }
      } else{
        return "他分野に渡って手広く展開するあなたの経営手腕は、他の牧場主からも一目置かれている"
      }
    },
    handleResize() {
      if (window.innerWidth <= 1000) {
          this.small = true
      } else {
          this.small = false
      }
    },
    toggleOmit(){
      this.omit = !this.omit
    }
  }
}

Vue.createApp(app).mount('#app')
