<template>
  <div>
    <h1>canvas学習用</h1>
    <v-container ref="canvasContainer" class="overflow-auto" style="height: 650px;">
      <v-row>
        <v-col>
          <canvas id="front" style="border: solid"></canvas>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { fabric } from 'fabric'

export default {
  name: 'TestCanvas',
  props: {
    msg: String
  },
  mounted () {
    this.init()
  },
  // 当コンポーネント内データ
  data () {
    return {
      GridSize: 25,
      GridThick: 1,
      item: {
        "id": "0",
        "name": "TEST Rect",
        "displayName": "0/0/0/1",
        "portPsotNumber": "1",
        "matrix": {
          "scaleX": 3,
          "scaleY": 1,
          "translateX": 0,
          "translateY": 0,
          },
      },
      type: "unit",

      Cursor: {
        DEFAULT: "crosshair",
        MOVE: "move",
        POINTER: "pointer"
      },
      canvaz: null,
      curCanvaz: null,
      selectObject: null,
      objArray: []
    }
  },
  // 初期設定
  methods: {
    init () {
      this.canvaz = new fabric.Canvas('front')
      this.canvaz.defaultCursor.DEFAULT
      this.canvaz.selection = false
      this._size()
      this._grid()
      this.canvaz.on('mouse:down', () =>{
        const item = this.item
        const type = this.type

        let isAbort = false
        if(this.getRectActiveCnt() > 0) {
          isAbort = true
        }
        this.canvaz.on('mouse:move', () =>{ 
          isAbort = true 
        })
        this.canvaz.on('mouse:up', (opt) =>{
          //正確なマウス操作時のみオブジェクト生成を行う
          if(!isAbort){
            const {x, y} = opt.absolutePointer
            const translateX = this._calcApproximateForGrid(x) / this.GridSize
            const translateY = this._calcApproximateForGrid(y) / this.GridSize
            if(item.parts !== undefined){
              // TODO:その内やる…？
            } else {
              this.addRect(type, item, translateX, translateY)
            }
          }
        })
      })
      window.addEventListener('resize', this.size)
    },
    /*
    canvasのサイズ指定
     */
    _size(){
      // 25ピクセルが縦横100個分のサイズ
      const width = this.GridSize * 100
      const height = this.GridSize * 100
      this.canvaz.setWidth(this._calcApproximateForGrid(width) + this.GridThick)
      this.canvaz.setHeight(this._calcApproximateForGrid(height) + this.GridThick)
    },
    /*
    canvasに目盛り設定
     */
    _grid(){
      const lineProperty = {
        type: 'line',
        selectable: false,
        strokeWidth: this.GridThick,
        stroke: 'lightgrey'
      }
      // 縦横のピクセル
      const xLen = this.canvaz.width * 100
      const yLen = this.canvaz.height * 100
      // 縦横線の描画回数
      const xTimes = Math.round(xLen / this.GridSize) 
      const yTimes = Math.round(yLen / this.GridSize) 
      // 縦横線描画
      for (let i = 0; i <= xTimes; i++ ){
        this.canvaz.add(
          // [始点x,始点y,終点x,終点y] 
          new fabric.Line([i*this.GridSize, 0, i*this.GridSize, yLen], lineProperty)
        )
      }
      for (let i = 0; i <= yTimes; i++ ){
        this.canvaz.add(
          new fabric.Line([0, i*this.GridSize, xLen, i*this.GridSize], lineProperty)
        )
      }
    },
     /*
     キャンバス上の図形数を返す。
     */
    getRectActiveCnt(){
      const objs = this.canvaz.getActiveObjects()
      return objs.length
    },
    /*
     座標移動計算
     @Parm {number} posの座標
     @return グリッド中心の近似値
     */
    _calcApproximateForGrid(pos){
      return Math.round(pos / this.GridSize) * this.GridSize
    },
    /*
     オブジェクトID採番
     @Parm {String} prefix
     @return prefixと[0-9a-z]の11桁の組み合わせ
     */
    _genarateIdForOject(prefix){
      const suffix = Math.random.toString(36).slice(2)
      return prefix + '_' + suffix
    },
    /*
    単一部品の追加
    @Parm {Object} type 種別
    @Parm {Object} item 部品の詳細
    @Parm {Object} translateX X座標
    @Parm {Object} translateY Y座標
     */
    addRect(type, item, translateX, translateY){
      const mtrx = {
        scaleX: item.matrix.scaleX,
        scaleY: item.matrix.scaleY,
        left: translateX * this.GridSize,
        top: translateY * this.GridSize
      }
      const rectProperty = this._makeRectProperty(item.id, mtrx)
      const groupProperty = this._makeGroupProperty(type)
      const textProperty = this._makeTextProperty(mtrx, 1)
      const rect = new fabric.Rect(rectProperty)
      const text = new fabric.Text(item.name, textProperty)
      const group = new fabric.Group([rect, text], groupProperty)
      this.objArray.push({
        grouiId: groupProperty.id,
        havePartName: false,
        detail: item,
        topRectCnt: 1
      })
      // イベントリスナー
      this._setGroupEvent(group)
      // キャンバス描画
      this.canvaz.add(group)
    },
    /*グループのプロパティを作成
     @Parm {String} type
     @return {Object} プロパティ
     */
    _makeGroupProperty(type){
      return {
        id: this._genarateIdForOject(type),
        hasControls: false
      }
    },
    /*四角形のプロパティを作成
     @Parm {Object} id オブジェクトのID
     @Parm {Object} matrix matrix、座標
     @return {Object} プロパティ
     */
    _makeRectProperty(id, matrix){
      return {
        left: matrix.left,
        top: matrix.top,
        originX: 'left',
        originY: 'top',
        width: this.GridSize*matrix.scaleX,
        height: this.GridSize*matrix.scaleY,
        angle: 0,
        strokeWidth: this.GridSize*0.05,
        stroke: 'black',
        fill: 'transparent',
        id: id
      }
    },
    /*テキストのプロパティを作成
     @Parm {Object} matrix matrix、座標
     @Parm {Object} topRectCnt 上部四角数
     @Parm {Object} havePartName part.nameの有無フラグ
     @return {Object} プロパティ
     */
    _makeTextProperty(matrix, topRectCnt){
      let prop = {
        left: matrix.left + (this.GridSize*matrix.scaleX*topRectCnt*0.5),
        top: matrix.top,
        originX: 'center',
        originY: 'bottom',
        fontSize: 12,
        textAllign: 'center',
        storoke: 'gray'        
      }
      return prop
    },
    /*グループのイベントリスナーを定義する。
     @Parm {Object} group グループ
     */
    _setGroupEvent(group){
      group.on('moving', (opt) =>{
        const rect = group._objects.find(obj => obj.type === 'rect')
        const text = group._objects.find(obj => obj.type === 'text')

        // 該当部品検索、複数部品の場合、上部ユニット数を取得
        const objArray = this.objArray
        const findObj = objArray.find(data => data.grouiId === opt.transform.target.id)
        const topRectCnt = findObj.topRectCnt

        // オブジェクトの座標取得
        const rectTop = opt.transform.target.top
        const rectLeft = opt.transform.target.left

        // テキストの高さ幅考慮
        const pt = Math.ceil(text.height)
        // 左のTextのはみ出し部分ピクセル計算
        const leftTextWidth = (text.width/ 2 - (rect.width*topRectCnt/2))
        // 左のTextのはみ出しグリッド部分のピクセル計算
        // 1グリッドもはみ出していない場合は0
        const leftTextGrid = Math.ceil((leftTextWidth / this.GridSize)) * this.GridSize
        // 何ピクセルはみ出ているか
        let pl = leftTextGrid - leftTextWidth
        pl = text.width > rect.width ? pl : 0
        
        // 移動座標設定
        let setTop = this._calcApproximateForGrid(rectTop + pt) - pt
        let setleft = this._calcApproximateForGrid(rectLeft - pl) + pl
        // マイナス座標制御（左端、上端のはみ出さないように制御）
        setTop = setTop < this.GridSize * 0.5 ? this.GridSize - pt :setTop
        setleft = setleft < this.GridSize * 0.5 ? pl :setleft
        group.set({
          'top': setTop,
          'left': setleft
        }).setCoords()
      })
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.overflow-auto{
  overflow: auto;
} 
h1{
  text-align: center;
}
</style>
