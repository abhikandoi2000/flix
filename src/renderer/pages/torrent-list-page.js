const React = require('react')
const prettyBytes = require('prettier-bytes')
const request = require('request')

const Checkbox = require('material-ui/Checkbox').default
const LinearProgress = require('material-ui/LinearProgress').default

const TorrentSummary = require('../lib/torrent-summary')
const TorrentPlayer = require('../lib/torrent-player')
const {dispatch, dispatcher} = require('../lib/dispatcher')
// const log = require('../../main/log')

module.exports = class TorrentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      movies: [],
      shows: [],
      value: '',
      jawBone: null,
      jawBoneSeason: 1,
      isLoading: false
    };

    // This binding is necessary to make `this` work in the callback
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTileClick = this.handleTileClick.bind(this);
    this.handleShowTileClick = this.handleShowTileClick.bind(this);
    this.getJawBoneContent = this.getJawBoneContent.bind(this);
    this.onSeasonChange = this.onSeasonChange.bind(this);
    this.setLoaderAndSearch = this.setLoaderAndSearch.bind(this);
    this.search = this.search.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }


  handleKeyPress(e) {
    // console.log(e.target.value);
    if(e.key === 'Enter') {
          this.setLoaderAndSearch(e.target.value)
    }
  }

  setLoaderAndSearch(query) {
    this.setState({isLoading: true}, function(){
      this.search(query);
    });
  }

  search(query) {
    request('http://10.0.0.4:5000/search?q=' + query, { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      // console.log(body);
      this.setState({movies: body.movies, shows: body.tv, isLoading: false});
    });
    // const self = this;
    // request.get(`http://10.0.0.3:5051/search?q=${query}`)
    //   .on('response', function(resp) {
    //     resp.resume();
    //     resp.on('end', () => {
    //       if (!resp.complete) {
    //         console.error(
    //           'The connection was terminated while the message was still being sent');

    //     self.setState({movies: [], shows: [], isLoading: false});
    //       }

    //     self.setState({movies: body.movies, shows: body.tv, isLoading: false});
    //     });
    //   }).on('error', function(err) {
    //     console.error(err);
    //     self.setState({movies: [], shows: [], isLoading: false});
    //   });
    
  }

  handleTileClick(movie) {
    // console.log(movie)
    if(movie.magnets.length > 0) {
      dispatch('addTorrent', movie.magnets[0].magnet_url)
    }
  }

  handleShowTileClick(e, show) {
    // console.log(e, show);
    this.setState({jawBone: show, jawBoneSeason: 1});
  }

  getJawBoneContent(rowItems) {
    if(this.state.jawBone) {
      // console.log('jawBone', this.state.jawBone);
      const id = this.state.jawBone.title_id
      const show = this.state.jawBone

      for (var i = rowItems.length - 1; i >= 0; i--) {
        if(rowItems[i].title_id == id) {
          // console.log('found match for jawBone ')
          return (<div key={id} className="jawcontent">
            <div className="tile__media">
              <select>
                {show.seasons.map((season, idx) => 
                  <option>Season {idx+1}</option>
                )}
              </select>
            </div>
          </div>)
        }
      }
    }

    return null
  }

  handleEpisodeTileClick(e, episode) {
    console.log("Episode link clicked");
    if(episode.magnets.length > 0) {
      dispatch('addTorrent', episode.magnets[0].magnet_url)
    }
  }

  onSeasonChange(event) {
    const season = event.target.value
    this.setState({jawBoneSeason: season})
  }

  render () {
    const state = this.props.state

    const contents = []
    contents.push(
      <div key='search-bar' className='search-box'>
        <div className='search-input'>
          <input placeholder='Titles, genre' value={state.value} onChange={this.handleChange} onKeyPress={this.handleKeyPress}/>
        </div>
      </div>
    )

    // console.log("DEBUG: ", this.state);
    if (this.state.isLoading) {
      contents.push(<div key="fullPageLoader" className="full-loader">Loading...</div>);
      return (
        <div key='torrent-list' className='torrent-list'>
          {contents}
        </div>
      );
    }

    // console.log('all movies', this.state.movies);
    if(this.state.movies) {
      const movieItems = this.state.movies.map((movie, key) =>
          <div key={movie.title_id} className={movie.magnets.length ? "tile" : "tile no-magnet"} onClick={(e) => this.handleTileClick(movie)}>
            <div className="tile__media">
              <img className="tile__img" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/70390/show-2.jpg" alt=""  />
            </div>
            <div className="tile__details">
              <div className="tile__title">
                {movie.title} ({movie.year})
              </div>
            </div>
          </div>
      )
      const perRow = 4
      var index = 0
      const movieRows = []
      var rowItems = []
      for(item in movieItems) {
        rowItems.push(movieItems[item])
        if (index % perRow == 3) {
          movieRows.push(
            <div className="row">
              <div className="row__inner">
              {rowItems}
              </div>
            </div>
          )
          rowItems = []
        }
        index = index + 1
      }
      movieRows.push(
        <div className="row">
          <div className="row__inner">
          {rowItems}
          </div>
        </div>
      )

      // console.log(movieRows)

      contents.push(
        <div key='results'>
          {movieRows}
        </div>
      )
    } else {
      contents.push(<div key='blank'>No results</div>)
    }

    if(this.state.shows) {
      const showItems = this.state.shows.map((show, key) =>
          <div key={show.title_id} className="tile" onClick={(e) => this.handleShowTileClick(e, show)}>
            <div className="tile__media">
              <img className="tile__img" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/70390/show-2.jpg" alt=""  />
            </div>
            <div className="tile__details">
              <div className="tile__title">
                {show.title} ({show.year})
              </div>
            </div>
          </div>
      )
      
      const perRow = 4
      var index = 0
      const showRows = []
      var rowItems = []
      
      var jawBoneContent = null;
      for(item in showItems) {

        if(this.state.jawBone) {
          // console.log('jawBone', this.state.jawBone);
          const id = this.state.jawBone.title_id
          const show = this.state.jawBone

          if(this.state.shows[item].title_id == id) {
            // console.log('found match for jawBone', show.seasons)
            // console.log('selected season is', this.state.jawBoneSeason, show.seasons[this.state.jawBoneSeason])
            const episodes = show.seasons[this.state.jawBoneSeason].episodes.map((episode, key) => episode[Object.keys(episode)[0]])
            const episodeItems = episodes.map((episode, key) =>
                <div key={episode.id} className={episode.magnets.length ? "tile" : "tile no-magnet"} onClick={(e) => this.handleEpisodeTileClick(e, episode)}>
                  <div className="tile__media">
                    <img className="tile__img" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/70390/show-3.jpg" alt=""  />
                  </div>
                  <div className="tile__details">
                    <div className="tile__title">
                      {episode.title} ({episode.run_time} min)
                    </div>
                  </div>
                </div>
            )
            jawBoneContent = (<div key={id} className="jawcontent">
              <div className="tile__media">
                <select onChange={this.onSeasonChange}>
                  {Object.keys(show.seasons).map((season, idx) => 
                    <option value={season}>Season {season}</option>
                  )}
                </select>
                <div className="row">
                  <div className="row__inner">
                  {episodeItems}
                  </div>
                </div>
              </div>
            </div>)
          }
        }

        rowItems.push(showItems[item])
        if (index % perRow == 3) {
          showRows.push(
            <div className="row">
              <div className="row__inner">
              {rowItems}
              </div>
              <div className="jawBoneContent">
              {jawBoneContent}
              </div>
            </div>
          )
          rowItems = []
          jawBoneContent = null
        }
        index = index + 1
      }
      showRows.push(
        <div className="row">
          <div className="row__inner">
          {rowItems}
          </div>
          <div className="jawBoneContent">
            {jawBoneContent}
          </div>
        </div>
      )

      // console.log(showRows)

      contents.push(
        <div key='show-results'>
          {showRows}
        </div>
      )
    } else {
      contents.push(<div key='blank'>No shows</div>)
    }

    if (state.downloadPathStatus === 'missing') {
      contents.push(
        <div key='torrent-missing-path'>
          <p>Download path missing: {state.saved.prefs.downloadPath}</p>
          <p>Check that all drives are connected?</p>
          <p>Alternatively, choose a new download path
            in <a href='#' onClick={dispatcher('preferences')}>Preferences</a>
          </p>
        </div>
      )
    }
    const torrentElems = state.saved.torrents.map(
      (torrentSummary) => this.renderTorrent(torrentSummary)
    )
    contents.push(...torrentElems)
    contents.push(
      <div key='torrent-placeholder' className='torrent-placeholder'>
        <span className='ellipsis'>Drop a torrent file here or paste a magnet link</span>
      </div>
    )

    return (
      <div key='torrent-list' className='torrent-list'>
        {contents}
      </div>
    )
  }

  renderTorrent (torrentSummary) {
    const state = this.props.state
    const infoHash = torrentSummary.infoHash
    const isSelected = infoHash && state.selectedInfoHash === infoHash

    // Background image: show some nice visuals, like a frame from the movie, if possible
    const style = {}
    if (torrentSummary.posterFileName) {
      const gradient = 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%)'
      const posterPath = TorrentSummary.getPosterPath(torrentSummary)
      style.backgroundImage = `${gradient}, url('${posterPath}')`
    }

    // Foreground: name of the torrent, basic info like size, play button,
    // cast buttons if available, and delete
    const classes = ['torrent']
    if (isSelected) classes.push('selected')
    if (!infoHash) classes.push('disabled')
    if (!torrentSummary.torrentKey) throw new Error('Missing torrentKey')
    return (
      <div
        id={torrentSummary.testID && ('torrent-' + torrentSummary.testID)}
        key={torrentSummary.torrentKey}
        style={style}
        className={classes.join(' ')}
        onContextMenu={infoHash && dispatcher('openTorrentContextMenu', infoHash)}
        onClick={infoHash && dispatcher('toggleSelectTorrent', infoHash)}>
        {this.renderTorrentMetadata(torrentSummary)}
        {infoHash ? this.renderTorrentButtons(torrentSummary) : null}
        {isSelected ? this.renderTorrentDetails(torrentSummary) : null}
        <hr />
      </div>
    )
  }

  // Show name, download status, % complete
  renderTorrentMetadata (torrentSummary) {
    const name = torrentSummary.name || 'Loading torrent...'
    const elements = [(
      <div key='name' className='name ellipsis'>{name}</div>
    )]

    // If it's downloading/seeding then show progress info
    const prog = torrentSummary.progress
    let progElems
    if (torrentSummary.error) {
      progElems = [getErrorMessage(torrentSummary)]
    } else if (torrentSummary.status !== 'paused' && prog) {
      progElems = [
        renderDownloadCheckbox(),
        renderTorrentStatus(),
        renderProgressBar(),
        renderPercentProgress(),
        renderTotalProgress(),
        renderPeers(),
        renderSpeeds(),
        renderEta()
      ]
    } else {
      progElems = [
        renderDownloadCheckbox(),
        renderTorrentStatus()
      ]
    }
    elements.push(
      <div key='progress-info' className='ellipsis'>
        {progElems}
      </div>
    )

    return (<div key='metadata' className='metadata'>{elements}</div>)

    function renderDownloadCheckbox () {
      const infoHash = torrentSummary.infoHash
      const isActive = ['downloading', 'seeding'].includes(torrentSummary.status)
      return (
        <Checkbox
          key='download-button'
          className={'control download ' + torrentSummary.status}
          style={{
            display: 'inline-block',
            width: 32
          }}
          iconStyle={{
            width: 20,
            height: 20
          }}
          checked={isActive}
          onClick={stopPropagation}
          onCheck={dispatcher('toggleTorrent', infoHash)} />
      )
    }

    function renderProgressBar () {
      const progress = Math.floor(100 * prog.progress)
      const styles = {
        wrapper: {
          display: 'inline-block',
          marginRight: 8
        },
        progress: {
          height: 8,
          width: 30
        }
      }
      return (
        <div style={styles.wrapper}>
          <LinearProgress style={styles.progress} mode='determinate' value={progress} />
        </div>
      )
    }

    function renderPercentProgress () {
      const progress = Math.floor(100 * prog.progress)
      return (<span key='percent-progress'>{progress}%</span>)
    }

    function renderTotalProgress () {
      const downloaded = prettyBytes(prog.downloaded)
      const total = prettyBytes(prog.length || 0)
      if (downloaded === total) {
        return (<span key='total-progress'>{downloaded}</span>)
      } else {
        return (<span key='total-progress'>{downloaded} / {total}</span>)
      }
    }

    function renderPeers () {
      if (prog.numPeers === 0) return
      const count = prog.numPeers === 1 ? 'peer' : 'peers'
      return (<span key='peers'>{prog.numPeers} {count}</span>)
    }

    function renderSpeeds () {
      let str = ''
      if (prog.downloadSpeed > 0) str += ' ↓ ' + prettyBytes(prog.downloadSpeed) + '/s'
      if (prog.uploadSpeed > 0) str += ' ↑ ' + prettyBytes(prog.uploadSpeed) + '/s'
      if (str === '') return
      return (<span key='download'>{str}</span>)
    }

    function renderEta () {
      const downloaded = prog.downloaded
      const total = prog.length || 0
      const missing = total - downloaded
      const downloadSpeed = prog.downloadSpeed
      if (downloadSpeed === 0 || missing === 0) return

      const rawEta = missing / downloadSpeed
      const hours = Math.floor(rawEta / 3600) % 24
      const minutes = Math.floor(rawEta / 60) % 60
      const seconds = Math.floor(rawEta % 60)

      // Only display hours and minutes if they are greater than 0 but always
      // display minutes if hours is being displayed
      const hoursStr = hours ? hours + 'h' : ''
      const minutesStr = (hours || minutes) ? minutes + 'm' : ''
      const secondsStr = seconds + 's'

      return (<span>{hoursStr} {minutesStr} {secondsStr} remaining</span>)
    }

    function renderTorrentStatus () {
      let status
      if (torrentSummary.status === 'paused') {
        if (!torrentSummary.progress) status = ''
        else if (torrentSummary.progress.progress === 1) status = 'Not seeding'
        else status = 'Paused'
      } else if (torrentSummary.status === 'downloading') {
        status = 'Downloading'
      } else if (torrentSummary.status === 'seeding') {
        status = 'Seeding'
      } else { // torrentSummary.status is 'new' or something unexpected
        status = ''
      }
      return (<span key='torrent-status'>{status}</span>)
    }
  }

  // Download button toggles between torrenting (DL/seed) and paused
  // Play button starts streaming the torrent immediately, unpausing if needed
  renderTorrentButtons (torrentSummary) {
    const infoHash = torrentSummary.infoHash

    // Only show the play/dowload buttons for torrents that contain playable media
    let playButton
    if (!torrentSummary.error && TorrentPlayer.isPlayableTorrentSummary(torrentSummary)) {
      playButton = (
        <i
          key='play-button'
          title='Start streaming'
          className={'icon play'}
          onClick={dispatcher('playFile', infoHash)}>
          play_circle_outline
        </i>
      )
    }

    return (
      <div className='torrent-controls'>
        {playButton}
        <i
          key='delete-button'
          className='icon delete'
          title='Remove torrent'
          onClick={dispatcher('confirmDeleteTorrent', infoHash, false)}>
          close
        </i>
      </div>
    )
  }

  // Show files, per-file download status and play buttons, and so on
  renderTorrentDetails (torrentSummary) {
    let filesElement
    if (torrentSummary.error || !torrentSummary.files) {
      let message = ''
      if (torrentSummary.error === 'path-missing') {
        // Special case error: this torrent's download dir or file is missing
        message = 'Missing path: ' + TorrentSummary.getFileOrFolder(torrentSummary)
      } else if (torrentSummary.error) {
        // General error for this torrent: just show the message
        message = torrentSummary.error.message || torrentSummary.error
      } else if (torrentSummary.status === 'paused') {
        // No file info, no infohash, and we're not trying to download from the DHT
        message = 'Failed to load torrent info. Click the download button to try again...'
      } else {
        // No file info, no infohash, trying to load from the DHT
        message = 'Downloading torrent info...'
      }
      filesElement = (
        <div key='files' className='files warning'>
          {message}
        </div>
      )
    } else {
      // We do know the files. List them and show download stats for each one
      const fileRows = torrentSummary.files
        .filter((file) => !file.path.includes('/.____padding_file/'))
        .map((file, index) => ({ file, index }))
        .map((object) => this.renderFileRow(torrentSummary, object.file, object.index))

      filesElement = (
        <div key='files' className='files'>
          <table>
            <tbody>
              {fileRows}
            </tbody>
          </table>
        </div>
      )
    }

    return (
      <div key='details' className='torrent-details'>
        {filesElement}
      </div>
    )
  }

  // Show a single torrentSummary file in the details view for a single torrent
  renderFileRow (torrentSummary, file, index) {
    // First, find out how much of the file we've downloaded
    // Are we even torrenting it?
    const isSelected = torrentSummary.selections && torrentSummary.selections[index]
    let isDone = false // Are we finished torrenting it?
    let progress = ''
    if (torrentSummary.progress && torrentSummary.progress.files &&
        torrentSummary.progress.files[index]) {
      const fileProg = torrentSummary.progress.files[index]
      isDone = fileProg.numPiecesPresent === fileProg.numPieces
      progress = Math.round(100 * fileProg.numPiecesPresent / fileProg.numPieces) + '%'
    }

    // Second, for media files where we saved our position, show how far we got
    let positionElem
    if (file.currentTime) {
      // Radial progress bar. 0% = start from 0:00, 270% = 3/4 of the way thru
      positionElem = this.renderRadialProgressBar(file.currentTime / file.duration)
    }

    // Finally, render the file as a table row
    const isPlayable = TorrentPlayer.isPlayable(file)
    const infoHash = torrentSummary.infoHash
    let icon
    let handleClick
    if (isPlayable) {
      icon = 'play_arrow' /* playable? add option to play */
      handleClick = dispatcher('playFile', infoHash, index)
    } else {
      icon = 'description' /* file icon, opens in OS default app */
      handleClick = isDone
        ? dispatcher('openItem', infoHash, index)
        : (e) => e.stopPropagation() // noop if file is not ready
    }
    // TODO: add a css 'disabled' class to indicate that a file cannot be opened/streamed
    let rowClass = ''
    if (!isSelected) rowClass = 'disabled' // File deselected, not being torrented
    if (!isDone && !isPlayable) rowClass = 'disabled' // Can't open yet, can't stream
    return (
      <tr key={index} onClick={handleClick}>
        <td className={'col-icon ' + rowClass}>
          {positionElem}
          <i className='icon'>{icon}</i>
        </td>
        <td className={'col-name ' + rowClass}>
          {file.name}
        </td>
        <td className={'col-progress ' + rowClass}>
          {isSelected ? progress : ''}
        </td>
        <td className={'col-size ' + rowClass}>
          {prettyBytes(file.length)}
        </td>
        <td className='col-select'
          onClick={dispatcher('toggleTorrentFile', infoHash, index)}>
          <i className='icon deselect-file'>{isSelected ? 'close' : 'add'}</i>
        </td>
      </tr>
    )
  }

  renderRadialProgressBar (fraction, cssClass) {
    const rotation = 360 * fraction
    const transformFill = {transform: 'rotate(' + (rotation / 2) + 'deg)'}
    const transformFix = {transform: 'rotate(' + rotation + 'deg)'}

    return (
      <div key='radial-progress' className={'radial-progress ' + cssClass}>
        <div key='circle' className='circle'>
          <div key='mask-full' className='mask full' style={transformFill}>
            <div key='fill' className='fill' style={transformFill} />
          </div>
          <div key='mask-half' className='mask half'>
            <div key='fill' className='fill' style={transformFill} />
            <div key='fill-fix' className='fill fix' style={transformFix} />
          </div>
        </div>
        <div key='inset' className='inset' />
      </div>
    )
  }
}

function stopPropagation (e) {
  e.stopPropagation()
}

function getErrorMessage (torrentSummary) {
  const err = torrentSummary.error
  if (err === 'path-missing') {
    return (
      <span>
        Path missing.<br />
        Fix and restart the app, or delete the torrent.
      </span>
    )
  }
  return 'Error'
}
