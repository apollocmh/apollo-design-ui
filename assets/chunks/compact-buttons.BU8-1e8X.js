const t=`<script setup lang="ts">
import { SpaceCompact } from '../../index';
import { BTN_DEFAULT, BTN_PRIMARY } from './_standin';
<\/script>

<template>
  <div>
    <SpaceCompact block>
      <button type="button" :style="BTN_DEFAULT">Like</button>
      <button type="button" :style="BTN_DEFAULT">Comment</button>
      <button type="button" :style="BTN_DEFAULT">Star</button>
      <button type="button" :style="BTN_DEFAULT">Heart</button>
      <button type="button" :style="BTN_DEFAULT">Share</button>
      <button type="button" :style="BTN_DEFAULT">Download</button>
      <button type="button" :style="BTN_DEFAULT">More</button>
    </SpaceCompact>
    <br />
    <SpaceCompact block>
      <button type="button" :style="BTN_PRIMARY">Button 1</button>
      <button type="button" :style="BTN_PRIMARY">Button 2</button>
      <button type="button" :style="BTN_PRIMARY">Button 3</button>
      <button type="button" :style="BTN_PRIMARY">Button 4</button>
      <button type="button" :style="BTN_PRIMARY" disabled>Download</button>
      <button type="button" :style="BTN_PRIMARY">Download</button>
    </SpaceCompact>
    <br />
    <SpaceCompact block>
      <button type="button" :style="BTN_DEFAULT">Button 1</button>
      <button type="button" :style="BTN_DEFAULT">Button 2</button>
      <button type="button" :style="BTN_DEFAULT">Button 3</button>
      <button type="button" :style="BTN_DEFAULT" disabled>Download</button>
      <button type="button" :style="BTN_DEFAULT">Download</button>
      <button type="button" :style="BTN_PRIMARY">Button 4</button>
      <button type="button" :style="BTN_PRIMARY">More</button>
    </SpaceCompact>
  </div>
</template>
`;export{t as default};
